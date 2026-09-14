/**
 * Repair completion background job — Phase 4
 *
 * Runs every minute. Queries all unfinished repair jobs whose timer has elapsed
 * and finalises each one (marks complete, updates car/defect state, awards XP).
 *
 * Uses completeRepairJob which guards against double-processing with an
 * atomic UPDATE WHERE completed=false.
 */

import cron from 'node-cron';
import { sql } from '../db/client.js';
import { completeRepairJob } from '../services/repairQueue.js';

export function startRepairCompletionJob(log) {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    let jobs;
    try {
      jobs = await sql`
        SELECT id, car_id, defect_id, repair_type, completes_at, completed, cost_charged
        FROM repair_jobs
        WHERE completed = false
          AND completes_at <= NOW()
      `;
    } catch (err) {
      log.error({ err }, '[repairCompletion] Failed to query overdue repair jobs');
      return;
    }

    if (jobs.length === 0) return;

    log.info({ count: jobs.length }, '[repairCompletion] Processing overdue repair jobs');

    for (const job of jobs) {
      try {
        await completeRepairJob(job);
      } catch (err) {
        log.error({ err, jobId: job.id }, '[repairCompletion] Failed to complete repair job');
      }
    }
  });

  log.info('[repairCompletion] Scheduled (every minute)');
}
