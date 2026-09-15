/**
 * Buyer Inquiry background job — Phase 5
 *
 * Runs once per in-game day tick (every INGAME_DAY_REAL_MINUTES real minutes).
 *
 * For each active listing:
 *   1. Roll inquiry probability (GMS §9.1)
 *   2. If inquiry fires, generate 1–3 NPC buyers (GMS §9.2)
 *   3. Check quick-fix discovery for each buyer who inspects (GMS §8.3)
 *   4. Generate buyer dialogue via aiProxy (cached Gemini response)
 *   5. Write buyer_inquiries row
 *
 * Rate limit: max 5 Gemini calls per job run (Phase 7 hardening).
 *
 * This job is designed to be idempotent — each listing is processed
 * independently. If the job crashes mid-run, incomplete listings simply
 * get processed on the next tick.
 */

import cron from 'node-cron';
import { sql } from '../db/client.js';
import { generateBuyerInquiry } from '../services/buyerGenerator.js';
import { INGAME_DAY_REAL_MINUTES } from '../config.js';

const INGAME_DAY_REAL_MS = INGAME_DAY_REAL_MINUTES * 60 * 1000;

export function startBuyerInquiryJob(log) {
  // Run every minute; actual logic is gated by whether the in-game day has elapsed
  // since the listing's last inquiry check.
  cron.schedule('* * * * *', async () => {
    let listings;
    try {
      // Find active listings that haven't been checked in the last in-game day
      // We use listed_at and a last_inquiry_check_at column approach:
      // Since we don't have last_inquiry_check_at, we check if any inquiries were
      // generated in the past INGAME_DAY_REAL_MS window. If not, generate for this day.
      //
      // Simple approach: run once per INGAME_DAY_REAL_MS globally (keyed to
      // player's last_day_ticked_at being updated this cycle).
      // We piggyback on the holdingCost job's in_game_day advancement.
      listings = await sql`
        SELECT l.id, l.player_id, p.in_game_day
        FROM listings l
        JOIN players p ON p.id = l.player_id
        WHERE l.status = 'active'
          AND l.expires_at > NOW()
          AND NOT EXISTS (
            -- Skip if an inquiry was already generated in this real-time window
            SELECT 1 FROM buyer_inquiries bi
            WHERE bi.listing_id = l.id
              AND bi.generated_at > NOW() - (${INGAME_DAY_REAL_MINUTES} || ' minutes')::interval
          )
          -- Only run if at least one in-game day has elapsed since listing creation or last check
          AND l.listed_at < NOW() - (${INGAME_DAY_REAL_MINUTES} || ' minutes')::interval
      `;
    } catch (err) {
      log.error({ err }, '[buyerInquiry] Failed to query active listings');
      return;
    }

    if (listings.length === 0) return;

    log.info({ count: listings.length }, '[buyerInquiry] Processing active listings');

    for (const listing of listings) {
      try {
        const count = await generateBuyerInquiry(listing.id, log);
        if (count > 0) {
          log.info({ listingId: listing.id, count }, '[buyerInquiry] Generated inquiries');
        }
      } catch (err) {
        log.error({ err, listingId: listing.id }, '[buyerInquiry] Failed to process listing');
      }
    }
  });

  log.info('[buyerInquiry] Scheduled (every minute, runs per-listing when in-game day elapses)');
}
