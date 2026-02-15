import fp from 'fastify-plugin'
import fastifyFormbody from '@fastify/formbody'

export default fp(async (fastify) => {
  await fastify.register(fastifyFormbody)
})
