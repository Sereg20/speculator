/**
 * Car state machine — the ONLY place car state transitions are allowed.
 * No route handler should ever do a direct SQL UPDATE on cars.state.
 *
 * Valid transitions:
 *   available_in_market → purchased
 *   purchased           → in_repair
 *   purchased           → listed_for_sale
 *   in_repair           → purchased  (repair complete)
 *   listed_for_sale     → sold
 *   listed_for_sale     → purchased  (listing cancelled)
 */

import { sql } from '../db/client.js';

const ALLOWED_TRANSITIONS = {
  available_in_market: ['purchased'],
  purchased:           ['in_repair', 'listed_for_sale'],
  in_repair:           ['purchased'],
  listed_for_sale:     ['sold', 'purchased'],
};

/**
 * Transition a car to a new state.
 * Throws if the transition is not allowed.
 *
 * @param {string} carId
 * @param {string} targetState
 * @param {object} [opts]
 * @param {object} [opts.sqlClient] - optional postgres transaction client
 * @returns {Promise<void>}
 */
export async function transitionCar(carId, targetState, opts = {}) {
  const client = opts.sqlClient || sql;

  const [car] = await client`
    SELECT state FROM cars WHERE id = ${carId} FOR UPDATE
  `;

  if (!car) {
    throw Object.assign(new Error('Car not found'), { statusCode: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[car.state] || [];
  if (!allowed.includes(targetState)) {
    throw Object.assign(
      new Error(`Cannot transition car from '${car.state}' to '${targetState}'`),
      { statusCode: 400 },
    );
  }

  await client`
    UPDATE cars SET state = ${targetState}, updated_at = NOW()
    WHERE id = ${carId}
  `;
}
