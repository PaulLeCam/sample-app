// @flow

import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'

import {
  connectionFromPromisedArray,
  connectionArgs,
  connectionDefinitions,
  cursorForObjectInConnection,
  mutationWithClientMutationId,
} from 'graphql-relay'

import * as data from './data'

const getRoomMessages = (roomID: string, start: ?number, stop: ?number): Promise<Object[]> => {
  return data.roomMessages.getRange(roomID, start, stop).then((ids: string[]) => {
    return Promise.all(ids.map(data.message.read))
  })
}

const getUserJoinedRooms = (userID: string, start: ?number, stop: ?number): Promise<Object[]> => {
  return data.userJoinedRooms.getRange(userID, start, stop).then((ids: string[]) => {
    return Promise.all(ids.map(data.room.read))
  })
}

const MessageType = new GraphQLObjectType({
  name: 'Message',
  fields: () => ({
    messageID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    senderID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    sender: {
      type: UserType,
      resolve: ({ senderID }: { senderID: string }) => data.user.read(senderID),
    },
    roomID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    room: {
      type: RoomType,
      resolve: ({ roomID }: { roomID: string }) => data.room.read(roomID),
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

const {
  connectionType: MessageConnection,
  edgeType: MessageEdge,
} = connectionDefinitions({name: 'Message', nodeType: MessageType})

const RoomType = new GraphQLObjectType({
  name: 'Room',
  fields: () => ({
    roomID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    messages: {
      type: MessageConnection,
      args: connectionArgs,
      resolve: ({ roomID }: { roomID: string }, args: connectionArgs) => {
        return connectionFromPromisedArray(getRoomMessages(roomID), args)
      },
    },
  }),
})

const RoomInputType = new GraphQLInputObjectType({
  name: 'RoomInput',
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

const {
  connectionType: RoomConnection,
  edgeType: RoomEdge,
} = connectionDefinitions({name: 'Room', nodeType: RoomType})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    userID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    joinedRooms: {
      type: RoomConnection,
      args: connectionArgs,
      resolve: ({ userID }: { userID: string }, args: connectionArgs) => {
        return connectionFromPromisedArray(getUserJoinedRooms(userID), args)
      },
    },
  }),
})

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    viewer: {
      type: UserType,
      args: {
        sessionID: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      resolve: async (self: any, { sessionID }: { sessionID: string }) => {
        const session = await data.session.read(sessionID)
        return (session && session.userID)
          ? data.user.read(session.userID)
          : null
      },
    },
  }),
})

const CreateRoomMutation = mutationWithClientMutationId({
  name: 'CreateRoom',
  inputFields: {
    sessionID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    room: {
      type: new GraphQLNonNull(RoomInputType),
    },
  },
  outputFields: {
    roomEdge: {
      type: RoomEdge,
      resolve: async ({ room, userID }: Object) => ({
        cursor: cursorForObjectInConnection(getUserJoinedRooms(userID), room),
        node: room,
      }),
    },
    viewer: {
      type: UserType,
      resolve: ({ userID }: { userID: string }) => data.user.read(userID),
    },
  },
  mutateAndGetPayload: async ({ room: roomData, sessionID }: Object) => {
    const session = await data.session.read(sessionID)
    if (!session) {
      throw new Error('Invalid sessionID')
    }

    const exists = await data.roomname.get(roomData.name)
    if (exists) {
      throw new Error('Room already exists')
    }

    const room = await data.room.create(roomData)
    if (!room) {
      throw new Error('Error creating room')
    }

    await Promise.all([
      data.roomname.set(room.name, room.roomID),
      data.roomParticipants.add(room.roomID, session.userID),
      data.userJoinedRooms.add(session.userID, room.roomID),
    ])

    return {
      room,
      userID: session.userID,
    }
  },
})

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createRoom: CreateRoomMutation,
  }),
})

export default new GraphQLSchema({
  mutation: MutationType,
  query: QueryType,
})
