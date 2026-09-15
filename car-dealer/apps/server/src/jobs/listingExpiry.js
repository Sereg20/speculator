/**
 * Listing Expiry background job — Phase 5 / Phase 6
 *
 * Runs every minute. Checks for listings that have passed their expires_at
 * timestamp and marks them as expired.
 *
 * On expiry:
 *   - Listing status → 'expired'
 *   - Car state → 'purchased' (back to garage)
 *   - Pending inquiries → 'expired'
 *   - Reputation −1 (GMS §1.4: listing expires unsold)
 *   - Log analytics event
 *
 * Idempotent: UPDATE WHERE status='active' prevents double-processing.
 */

import cron from 'node-cron';
import { sql } from '../db/client.js';

export function startListingExpiryJob(log) {
  cron.schedule('* * * * *', async () => {
    let expiredListings;
    try {
      // Find listings that are past expiry and still active
      expiredListings = await sql`
        SELECT l.id, l.car_id, l.player_id
        FROM listings l
        WHERE l.status = 'active'
          AND l.expires_at <= NOW()
        LIMIT 50
      `;
    } catch (err) {
      log.error({ err }, '[listingExpiry] Failed to query expired listings');
      return;
    }

    if (expiredListings.length === 0) return;

    log.info({ count: expiredListings.length }, '[listingExpiry] Processing expired listings');

    for (const listing of expiredListings) {
      try {
        await _expireListing(listing, log);
      } catch (err) {
        log.error({ err, listingId: listing.id }, '[listingExpiry] Failed to expire listing');
      }
    }
  });

  log.info('[listingExpiry] Scheduled (every minute)');
}

async function _expireListing(listing, log) {
  await sql.begin(async tx => {
    // Atomic guard: only process if still active
    const updated = await tx`
      UPDATE listings SET status = 'expired'
      WHERE id = ${listing.id} AND status = 'active'
      RETURNING id
    `;
    if (updated.length === 0) return;  // already processed

    // Expire pending inquiries
    await tx`
      UPDATE buyer_inquiries SET status = 'expired'
      WHERE listing_id = ${listing.id}
        AND status IN ('pending', 'negotiating')
    `;

    // Return car to 'purchased' state
    await tx`
      UPDATE cars SET state = 'purchased', asking_price = NULL, updated_at = NOW()
      WHERE id = ${listing.car_id} AND state = 'listed_for_sale'
    `;

    // Reputation penalty: −1 for listing expiry (GMS §1.4)
    await tx`
      UPDATE players
      SET reputation_score = GREATEST(0, reputation_score - 1),
          updated_at = NOW()
      WHERE id = ${listing.player_id}
    `;

    // Log analytics
    await tx`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (
        ${listing.player_id}, 'listing_expired',
        ${tx.json({ listingId: listing.id, carId: listing.car_id })}
      )
    `;
  });

  log.info({ listingId: listing.id }, '[listingExpiry] Listing expired, car returned to garage');
}
