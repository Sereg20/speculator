/**
 * JWT auth preHandler.
 * Attach as `preHandler` on any route that requires authentication.
 *
 * On success, sets `request.playerId` (string UUID).
 */
export async function requireAuth(request, reply) {
  try {
    await request.jwtVerify();
    request.playerId = request.user.playerId;
  } catch {
    reply.code(401).send({ data: null, error: 'Unauthorized', meta: null });
  }
}
