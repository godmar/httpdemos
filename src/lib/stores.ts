import { randomBytes } from 'node:crypto'

export type Todo = {
  id: string
  title: string
  done: boolean
  updatedAt: string
}

export type SessionUser = {
  username: string
  loginAt: number
}

export type SessionRecord = {
  id: string
  user: SessionUser
  csrfToken: string
}

export type RefreshTokenRecord = {
  tokenId: string
  userId: string
  parentId?: string
  familyId: string
  revoked: boolean
  expiresAt: number
}

const todos = new Map<string, Todo>()
const sessions = new Map<string, SessionRecord>()
const refreshTokens = new Map<string, RefreshTokenRecord>()

function randomId (size = 16): string {
  return randomBytes(size).toString('hex')
}

export const store = {
  createTodo (title: string, done: boolean): Todo {
    const id = randomId(8)
    const todo: Todo = {
      id,
      title,
      done,
      updatedAt: new Date().toISOString()
    }
    todos.set(id, todo)
    return todo
  },

  upsertTodo (id: string, title: string, done: boolean): Todo {
    const todo: Todo = {
      id,
      title,
      done,
      updatedAt: new Date().toISOString()
    }
    todos.set(id, todo)
    return todo
  },

  getTodo (id: string): Todo | undefined {
    return todos.get(id)
  },

  listTodos (): Todo[] {
    return Array.from(todos.values())
  },

  deleteTodo (id: string): boolean {
    return todos.delete(id)
  },

  createSession (username: string): SessionRecord {
    const id = randomId()
    const csrfToken = randomId(12)
    const record: SessionRecord = {
      id,
      user: { username, loginAt: Date.now() },
      csrfToken
    }
    sessions.set(id, record)
    return record
  },

  getSession (id: string): SessionRecord | undefined {
    return sessions.get(id)
  },

  deleteSession (id: string): void {
    sessions.delete(id)
  },

  issueRefreshToken (userId: string, ttlSeconds: number, parentId?: string, familyId?: string): RefreshTokenRecord {
    const tokenId = randomId()
    const record: RefreshTokenRecord = {
      tokenId,
      userId,
      parentId,
      familyId: familyId ?? tokenId,
      revoked: false,
      expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds
    }
    refreshTokens.set(tokenId, record)
    return record
  },

  getRefreshToken (tokenId: string): RefreshTokenRecord | undefined {
    return refreshTokens.get(tokenId)
  },

  revokeRefreshToken (tokenId: string): void {
    const record = refreshTokens.get(tokenId)
    if (record) record.revoked = true
  },

  revokeTokenFamily (familyId: string): number {
    let count = 0
    for (const record of refreshTokens.values()) {
      if (record.familyId === familyId && !record.revoked) {
        record.revoked = true
        count++
      }
    }
    return count
  }
}
