import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('root hub renders station index', async (t) => {
  const app = await build(t)
  const res = await app.inject({ url: '/' })

  assert.equal(res.statusCode, 200)
  assert.match(res.headers['content-type'] ?? '', /text\/html/)
  assert.match(res.payload, /HTTP Protocol Stations/)
  assert.match(res.payload, /stations\/forms/)
})
