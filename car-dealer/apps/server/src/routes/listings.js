/** Phase 5 — player sale listings */
export default async function listingRoutes(fastify) {
  fastify.post('/listings', async (_req, reply) => {
    reply.code(501).send({ data: null, error: 'Phase 5: Not implemented', meta: null });
  });
}
