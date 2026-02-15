import { FastifyPluginAsync } from 'fastify'
import { ensureJsonBody } from '../../../lib/http'
import { store } from '../../../lib/stores'

const todosApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.put('/:id', async (request, reply) => {
    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    const title = parsed.body.title
    const done = parsed.body.done
    if (typeof title !== 'string' || typeof done !== 'boolean') {
      reply.code(400)
      return { error: 'title must be string and done must be boolean' }
    }

    const todo = store.upsertTodo(id, title, done)
    reply.header('X-Idempotent-Method', 'PUT')
    return { todo }
  })

  fastify.get('/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    const todo = store.getTodo(id)
    if (!todo) {
      reply.code(404)
      return { error: 'todo not found' }
    }

    return { todo }
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    return { deleted: store.deleteTodo(id) }
  })
}

export default todosApi
