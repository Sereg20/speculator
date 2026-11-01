import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

fastify.get("/", async () => {
  return { message: "Server is working!" };
});

fastify.get("/health", async () => {
  return { status: "ok" };
});

try {
  await fastify.listen({
    port: Number(process.env.PORT) || 3000,
    host: "0.0.0.0",
  });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}