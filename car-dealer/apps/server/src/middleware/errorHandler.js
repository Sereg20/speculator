/**
 * Global error handler — converts unhandled errors to the standard API envelope.
 * Registered via fastify.setErrorHandler().
 */
export function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    request.log.error({ err: error }, 'Unhandled server error');
  }

  reply.code(statusCode).send({
    data: null,
    error: statusCode >= 500 ? 'Internal server error' : error.message,
    meta: null,
  });
}
