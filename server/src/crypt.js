// @flow

import bcrypt from 'bcrypt'

export const compare = (str: string, hash: string): Promise<bool> => {
  return new Promise((resolve: (same: bool) => any, reject: (err: Error) => any) => {
    bcrypt.compare(str, hash, (err: ?Error, res: bool) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

export const hash = (str: string, salt: number = 8): Promise<string> => {
  return new Promise((resolve: (hash: string) => any, reject: (err: Error) => any) => {
    bcrypt.hash(str, salt, (err: ?Error, res: string) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
