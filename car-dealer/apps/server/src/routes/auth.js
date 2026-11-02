import { sql } from '../db/client.js';
import { getEnergy } from '../services/energyService.js';
import { STARTING_MONEY } from '../config.js';
import { reputationTier, xpToNextLevel, xpLevelStart, xpNextLevelStart } from '../services/playerStats.js';

async function buildPlayerData(player) {
  const { current: energyCurrent, max: energyMax } = await getEnergy(player.id);

  const loan = player.loan_remaining > 0
    ? {
        tier:            player.loan_tier,
        principal:       player.loan_principal,
        remaining:       player.loan_remaining,
        dailyInstalment: player.loan_daily_instalment,
        startedAt:       player.loan_started_at,
      }
    : null;

  return {
    playerData: {
      ...player,
      energy_current:      energyCurrent,
      energy_max:          energyMax,
      reputation_tier:     reputationTier(player.reputation_score),
      xp_to_next_level:    xpToNextLevel(player.xp, player.level),
      xp_level_start:      xpLevelStart(player.level),
      xp_next_level_start: xpNextLevelStart(player.level),
      loan,
    },
    energyCurrent,
    energyMax,
  };
}

const PLAYER_SELECT = `
  id, device_id, display_name, cash, xp, level, reputation_score,
  energy_current, garage_slots, in_game_day, cash_stress_active,
  onboarding_complete, created_at, updated_at,
  loan_tier, loan_principal, loan_remaining, loan_daily_instalment, loan_started_at
`;

/**
 * POST /auth/register
 * Body: { deviceId: string, displayName?: string }
 * Returns: { token: string, player: Player }
 *
 * Creates a new player for the device. If device already exists, returns 409.
 * Use POST /auth/login for returning devices.
 */
async function register(request, reply) {
  const { deviceId, displayName } = request.body || {};
  if (!deviceId) {
    return reply.code(400).send({ data: null, error: 'deviceId is required', meta: null });
  }

  const existing = await sql`SELECT id FROM players WHERE device_id = ${deviceId}`;
  if (existing.length > 0) {
    return reply.code(409).send({
      data: null,
      error: 'Device already registered. Use POST /auth/login.',
      meta: null,
    });
  }

  const [inserted] = await sql`
    INSERT INTO players (device_id, display_name, cash)
    VALUES (${deviceId}, ${displayName || 'Перекупщик'}, ${STARTING_MONEY})
    RETURNING id
  `;

  // Grant all free (byn_price = 0) skills automatically on registration
  await sql`
    INSERT INTO player_skills (player_id, skill_id)
    SELECT ${inserted.id}, id FROM skill_tree WHERE byn_price = 0
    ON CONFLICT DO NOTHING
  `;

  // Re-fetch with full field set so RETURNING doesn't need to list every column
  const [player] = await sql`
    SELECT ${sql.unsafe(PLAYER_SELECT)} FROM players WHERE id = ${inserted.id}
  `;

  const token = await reply.jwtSign({ playerId: player.id }, { expiresIn: '365d' });
  const { playerData, energyCurrent, energyMax } = await buildPlayerData(player);

  return reply.code(201).send({
    data: { token, player: playerData },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent,
      energyMax,
    },
  });
}

/**
 * POST /auth/login
 * Body: { deviceId: string }
 * Returns: { token: string, player: Player }
 */
async function login(request, reply) {
  const { deviceId } = request.body || {};
  if (!deviceId) {
    return reply.code(400).send({ data: null, error: 'deviceId is required', meta: null });
  }

  const [player] = await sql`
    SELECT ${sql.unsafe(PLAYER_SELECT)} FROM players WHERE device_id = ${deviceId}
  `;

  if (!player) {
    return reply.code(404).send({ data: null, error: 'Device not found. Use POST /auth/register.', meta: null });
  }

  const token = await reply.jwtSign({ playerId: player.id }, { expiresIn: '365d' });
  const { playerData, energyCurrent, energyMax } = await buildPlayerData(player);

  return reply.send({
    data: { token, player: playerData },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent,
      energyMax,
    },
  });
}

export default async function authRoutes(fastify) {
  fastify.post('/auth/register', register);
  fastify.post('/auth/login', login);
}
