// @flow

import DataLoader from 'dataloader'
import Redis from 'ioredis'
import UUID from 'node-uuid'

const redis = Redis({
  keyPrefix: 'sampleapp:',
})

const createValueAccessors = (type: string) => {
  const getKey = (id: string) => `value:${type}:${id}`

  return {
    delete: (id: string): Promise<'OK'> => redis.del(getKey(id)),
    get: (id: string): Promise<?string> => redis.get(getKey(id)),
    set: (id: string, value: string): Promise<'OK'> => redis.set(getKey(id), value),
  }
}

const createObjectAccessors = (type: string) => {
  const getKey = (id: string) => `object:${type}:${id}`

  const loader = new DataLoader((ids: string[]): Promise<Object[]> => {
    const reqs = ids.map((id: string) => ['get', getKey(id)])
    return redis.multi(reqs).exec().then((results: Array<[?Error, ?string]>) => {
      return results.map((res: [?Error, ?string]) => res[1] ? JSON.parse(res[1]) : null)
    })
  })

  const write = (id: string, value: Object): Promise<'OK'> => {
    return redis.set(getKey(id), JSON.stringify(value))
  }

  return {
    create: async (value: Object): Promise<Object> => {
      const id: string = UUID.v4()
      value[`${type}ID`] = id
      await write(id, value)
      return value
    },
    read: (id: string): Promise<?Object> => loader.load(id),
    update: (id: string, value: Object): Promise<'OK'> => write(id, value),
    delete: (id: string): Promise<'OK'> => redis.del(getKey(id)),
  }
}

const createLinkAccessors = (fromType: string, linkType: string) => {
  const getKey = (id: string) => `link:${fromType}:${id}->${linkType}`

  return {
    add: (from: string, to: string): Promise<'OK'> => {
      return redis.zadd(getKey(from), Date.now(), to)
    },
    getRange: (from: string, start: ?number = 0, stop: ?number = -1): Promise<string[]> => {
      return redis.zrange(getKey(from), start, stop)
    },
    remove: (from: string, to: string): Promise<'OK'> => {
      return redis.zrem(getKey(from), to)
    },
  }
}

export const message = createObjectAccessors('message')

export const room = createObjectAccessors('room')
export const roomname = createValueAccessors('roomname')
export const roomMessages = createLinkAccessors('room', 'messages')
export const roomParticipants = createLinkAccessors('room', 'users')

export const session = createObjectAccessors('session')

export const user = createObjectAccessors('user')
export const username = createValueAccessors('username')
export const userpassword = createValueAccessors('userpassword')
export const userJoinedRooms = createLinkAccessors('user', 'rooms')
export const userSessions = createLinkAccessors('user', 'sessions')
