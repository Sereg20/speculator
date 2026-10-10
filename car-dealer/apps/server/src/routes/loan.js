/**
 * Loan routes — Phase 7
 *
 * Endpoints:
 *   GET  /player/loan           — current loan state (or null)
 *   POST /player/loan/take      — take a new loan { tier: 'small'|'medium' }
 *   POST /player/loan/repay     — early full repayment
 *
 * Rules:
 *   - One active loan at a time (loan_remaining > 0 blocks new take)
 *   - Level gate per tier
 *   - Daily auto-repayment handled by holdingCost.js job
 *   - Early repayment requires full balance; no partial early repay
 */

import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { getPlayerState } from '../services/energyService.js';
import { LOANS, CASH_STRESS_ENTRY, CASH_STRESS_EXIT } from '../config.js';

// ─── GET /player/loan ─────────────────────────────────────────────────────────

async function getLoan(request, reply) {
  const playerId = request.playerId;

  const [p] = await sql`
    SELECT loan_tier, loan_principal, loan_remaining,
           loan_daily_instalment, loan_started_at
    FROM players
    WHERE id = ${playerId}
  `;
  if (!p) return reply.code(404).send({ data: null, error: 'Player not found', meta: {} });

  const loan = p.loan_remaining > 0
    ? {
        tier:             p.loan_tier,
        principal:        p.loan_principal,
        remaining:        p.loan_remaining,
        dailyInstalment:  p.loan_daily_instalment,
        startedAt:        p.loan_started_at,
      }
    : null;

  return reply.send({ data: { loan }, error: null, meta: {} });
}

// ─── POST /player/loan/take ───────────────────────────────────────────────────

async function takeLoan(request, reply) {
  const playerId = request.playerId;
  const { tier } = request.body ?? {};

  if (!tier || !LOANS[tier]) {
    return reply.code(400).send({
      data: null,
      error: `Invalid loan tier. Valid values: ${Object.keys(LOANS).join(', ')}`,
      meta: {},
    });
  }

  const loanDef = LOANS[tier];

  await sql.begin(async tx => {
    const [p] = await tx`
      SELECT id, level, cash, loan_remaining, cash_stress_active
      FROM players
      WHERE id = ${playerId}
      FOR UPDATE
    `;
    if (!p) {
      const err = new Error('Player not found');
      err.statusCode = 404;
      throw err;
    }

    if (p.loan_remaining > 0) {
      const err = new Error('You already have an active loan. Repay it before taking a new one.');
      err.statusCode = 409;
      throw err;
    }

    if (p.level < loanDef.levelRequired) {
      const err = new Error(`Level ${loanDef.levelRequired} required to take a ${tier} loan.`);
      err.statusCode = 403;
      throw err;
    }

    const newCash = p.cash + loanDef.principal;
    const newStress = newCash < CASH_STRESS_ENTRY
      ? true
      : newCash > CASH_STRESS_EXIT
        ? false
        : p.cash_stress_active;

    await tx`
      UPDATE players
      SET cash                   = ${newCash},
          cash_stress_active     = ${newStress},
          loan_tier              = ${tier},
          loan_principal         = ${loanDef.principal},
          loan_remaining          = ${loanDef.totalRepay},
          loan_daily_instalment  = ${loanDef.dailyInstalment},
          loan_started_at        = NOW(),
          updated_at             = NOW()
      WHERE id = ${playerId}
    `;

    await tx`
      INSERT INTO transactions (player_id, type, amount, reference_id, description)
      VALUES (
        ${playerId}, 'loan_taken', ${loanDef.principal}, NULL,
        ${`Кредит банка (${tier}): +${loanDef.principal} BYN, к возврату ${loanDef.totalRepay} BYN`}
      )
    `;
  }).catch(err => {
    if (err.statusCode) {
      return reply.code(err.statusCode).send({ data: null, error: err.message, meta: {} });
    }
    throw err;
  });

  if (reply.sent) return;

  const playerState = await getPlayerState(playerId);
  return reply.send({
    data: {
      loan: {
        tier,
        principal:       LOANS[tier].principal,
        remaining:       LOANS[tier].totalRepay,
        dailyInstalment: LOANS[tier].dailyInstalment,
      },
    },
    error: null,
    meta: { playerState },
  });
}

// ─── POST /player/loan/repay ──────────────────────────────────────────────────

async function repayLoan(request, reply) {
  const playerId = request.playerId;

  await sql.begin(async tx => {
    const [p] = await tx`
      SELECT id, cash, loan_remaining, cash_stress_active
      FROM players
      WHERE id = ${playerId}
      FOR UPDATE
    `;
    if (!p) {
      const err = new Error('Player not found');
      err.statusCode = 404;
      throw err;
    }

    if (p.loan_remaining <= 0) {
      const err = new Error('No active loan to repay.');
      err.statusCode = 400;
      throw err;
    }

    if (p.cash < p.loan_remaining) {
      const err = new Error(
        `Not enough cash for full repayment. Need ${p.loan_remaining} BYN, have ${p.cash} BYN. ` +
        `Daily instalments will continue automatically.`,
      );
      err.statusCode = 400;
      throw err;
    }

    const newCash = p.cash - p.loan_remaining;
    const newStress = newCash < CASH_STRESS_ENTRY
      ? true
      : newCash > CASH_STRESS_EXIT
        ? false
        : p.cash_stress_active;
    const repaid = p.loan_remaining;

    await tx`
      UPDATE players
      SET cash                   = ${newCash},
          cash_stress_active     = ${newStress},
          loan_remaining          = 0,
          loan_principal         = 0,
          loan_daily_instalment  = 0,
          loan_tier              = NULL,
          loan_started_at        = NULL,
          updated_at             = NOW()
      WHERE id = ${playerId}
    `;

    await tx`
      INSERT INTO transactions (player_id, type, amount, reference_id, description)
      VALUES (
        ${playerId}, 'loan_repayment', ${-repaid}, NULL,
        ${`Досрочное погашение кредита: ${repaid} BYN`}
      )
    `;
  }).catch(err => {
    if (err.statusCode) {
      return reply.code(err.statusCode).send({ data: null, error: err.message, meta: {} });
    }
    throw err;
  });

  if (reply.sent) return;

  const playerState = await getPlayerState(playerId);
  return reply.send({
    data: { loan: null },
    error: null,
    meta: { playerState },
  });
}

// ─── Route registration ───────────────────────────────────────────────────────

export default async function loanRoutes(fastify) {
  fastify.get('/player/loan',         { preHandler: requireAuth }, getLoan);
  fastify.post('/player/loan/take',   { preHandler: requireAuth }, takeLoan);
  fastify.post('/player/loan/repay',  { preHandler: requireAuth }, repayLoan);
}
