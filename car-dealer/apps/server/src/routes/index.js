import authRoutes     from './auth.js';
import playerRoutes   from './player.js';
import marketRoutes   from './market.js';
import carRoutes      from './cars.js';
import inspectionRoutes from './inspection.js';
import repairRoutes   from './repair.js';
import listingRoutes  from './listings.js';
import adsRoutes      from './ads.js';

export default async function registerRoutes(fastify) {
  await fastify.register(authRoutes);
  await fastify.register(playerRoutes);
  await fastify.register(marketRoutes);
  await fastify.register(carRoutes);
  await fastify.register(inspectionRoutes);
  await fastify.register(repairRoutes);
  await fastify.register(listingRoutes);
  await fastify.register(adsRoutes);
}
