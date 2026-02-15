import { existsSync } from 'node:fs'
import { join } from 'node:path'
import fp from 'fastify-plugin'
import fastifyStatic from '@fastify/static'

export default fp(async (fastify) => {
  const distRoot = join(__dirname, '..', 'public')
  const srcRoot = join(__dirname, '..', '..', 'src', 'public')
  const root = existsSync(distRoot) ? distRoot : srcRoot

  await fastify.register(fastifyStatic, {
    root,
    prefix: '/public/'
  })
})
