import { randomUUID } from 'crypto';
import { sql } from '../db/client.js';
import { STARTING_MONEY } from '../config.js';

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

  const [player] = await sql`
    INSERT INTO players (device_id, display_name, cash)
    VALUES (${deviceId}, ${displayName || 'Перекупщик'}, ${STARTING_MONEY})
    RETURNING id, device_id, display_name, cash, xp, level, reputation_score,
              energy_current, garage_slots, in_game_day, onboarding_complete, created_at
  `;

  const token = await reply.jwtSign({ playerId: player.id }, { expiresIn: '365d' });

  return reply.code(201).send({
    data: { token, player },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent: player.energy_current,
      energyMax: 20,
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
    SELECT id, device_id, display_name, cash, xp, level, reputation_score,
           energy_current, garage_slots, in_game_day, onboarding_complete, created_at
    FROM players WHERE device_id = ${deviceId}
  `;

  if (!player) {
    return reply.code(404).send({ data: null, error: 'Device not found. Use POST /auth/register.', meta: null });
  }

  const token = await reply.jwtSign({ playerId: player.id }, { expiresIn: '365d' });

  return reply.send({
    data: { token, player },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent: player.energy_current,
      energyMax: 20,
    },
  });
}

export default async function authRoutes(fastify) {
  fastify.post('/auth/register', register);
  fastify.post('/auth/login', login);
}
