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

/**
 * Minimum real-time interval between inquiry attempts per listing.
 * Derived from asking price / market value ratio.
 * Lower ratio (underpriced) → shorter interval → inquiries arrive faster.
 */
function minCheckIntervalMinutes(ratio) {
  if (ratio < 0.90) return 5;    // underpriced  → every 5 min
  if (ratio <= 1.00) return 10;  // fair price   → every 10 min
  if (ratio <= 1.10) return 20;  // slight over  → every 20 min
  if (ratio <= 1.20) return 45;  // overpriced   → every 45 min
  return 90;                     // very over    → every 90 min
}

export function startBuyerInquiryJob(log) {
  // Run every minute; each listing is gated by its own price-ratio-based interval.
  cron.schedule('* * * * *', async () => {
    let listings;
    try {
      listings = await sql`
        SELECT l.id, l.player_id, l.asking_price, l.listed_at,
               COALESCE(c.market_value, l.asking_price) AS market_value,
               (SELECT MAX(bi.generated_at) FROM buyer_inquiries bi WHERE bi.listing_id = l.id) AS last_generated_at
        FROM listings l
        JOIN cars c ON c.id = l.car_id
        JOIN players p ON p.id = l.player_id
        WHERE l.status = 'active'
          AND l.expires_at > NOW()
      `;
    } catch (err) {
      log.error({ err }, '[buyerInquiry] Failed to query active listings');
      return;
    }

    if (listings.length === 0) return;

    const now = Date.now();
    for (const listing of listings) {
      try {
        const ratio = listing.market_value > 0 ? listing.asking_price / listing.market_value : 1.0;
        const intervalMs = minCheckIntervalMinutes(ratio) * 60 * 1000;
        // Use last inquiry time if available; otherwise use listing creation time
        const referenceAt = listing.last_generated_at
          ? new Date(listing.last_generated_at).getTime()
          : new Date(listing.listed_at).getTime();
        if (now - referenceAt < intervalMs) continue;

        const count = await generateBuyerInquiry(listing.id, log);
        if (count > 0) {
          log.info({ listingId: listing.id, count, ratio: ratio.toFixed(2) }, '[buyerInquiry] Generated inquiry');
        }
      } catch (err) {
        log.error({ err, listingId: listing.id }, '[buyerInquiry] Failed to process listing');
      }
    }
  });

  log.info('[buyerInquiry] Scheduled (every minute, price-ratio gated per listing)');
}
