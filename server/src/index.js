// @flow

import bodyParser from 'body-parser'
import express from 'express'
import type { $Request, $Response } from 'express'
import graphQLHTTP from 'express-graphql'

import { compare, hash } from './crypt'
import * as data from './data'
import schema from './schema'

const server = express()

server.use('/graphql', graphQLHTTP({
  graphiql: true,
  schema,
}))

server.use(bodyParser.json())

server.post('/login', async (req: $Request, res: $Response) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({error: 'Missing credentials'})
  }

  let userID
  try {
    userID = await data.username.get(req.body.username)
  } catch (err) {
    return res.status(400).send({error: 'Unknown username'})
  }

  const password = await data.userpassword.get(userID)
  const valid = await compare(req.body.password, password)

  if (valid) {
    const session = await data.session.create({userID})
    res.send(session)
  } else {
    res.status(400).send({error: 'Bad password'})
  }
})

server.post('/logout', async (req: $Request, res: $Response) => {
  await data.session.delete(req.body.sessionID)
  res.sendStatus(204)
})

server.post('/register', async (req: $Request, res: $Response) => {
  const { password, ...body } = req.body

  if (!password || !body.username) {
    return res.status(400).send({error: 'Missing credentials'})
  }

  const exists = await data.username.get(body.username)
  if (exists) {
    return res.status(400).send({error: 'Unavailable username'})
  }

  const [ user, passwordHash ] = await Promise.all([
    data.user.create(body),
    hash(password),
  ])
  const [ sessionID ] = await Promise.all([
    data.session.create({userID: user.userID}),
    data.username.set(body.username, user.userID),
    data.userpassword.set(user.userID, passwordHash),
  ])
  res.send({sessionID})
})

server.listen(3000)
