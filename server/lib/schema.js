'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _data = require('./data');

var data = _interopRequireWildcard(_data);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getRoomMessages = function getRoomMessages(roomID, start, stop) {
  return data.roomMessages.getRange(roomID, start, stop).then(function (ids) {
    return _promise2.default.all(ids.map(data.message.read));
  });
};

var getUserJoinedRooms = function getUserJoinedRooms(userID, start, stop) {
  return data.userJoinedRooms.getRange(userID, start, stop).then(function (ids) {
    return _promise2.default.all(ids.map(data.room.read));
  });
};

var MessageType = new _graphql.GraphQLObjectType({
  name: 'Message',
  fields: function fields() {
    return {
      messageID: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
      },
      senderID: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
      },
      sender: {
        type: UserType,
        resolve: function resolve(_ref) {
          var senderID = _ref.senderID;
          return data.user.read(senderID);
        }
      },
      roomID: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
      },
      room: {
        type: RoomType,
        resolve: function resolve(_ref2) {
          var roomID = _ref2.roomID;
          return data.room.read(roomID);
        }
      },
      text: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
      }
    };
  }
});

var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({ name: 'Message', nodeType: MessageType });

var MessageConnection = _connectionDefinition.connectionType;
var MessageEdge = _connectionDefinition.edgeType;


var RoomType = new _graphql.GraphQLObjectType({
  name: 'Room',
  fields: function fields() {
    return {
      roomID: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
      },
      name: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
      },
      messages: {
        type: MessageConnection,
        args: _graphqlRelay.connectionArgs,
        resolve: function resolve(_ref3, args) {
          var roomID = _ref3.roomID;

          return (0, _graphqlRelay.connectionFromPromisedArray)(getRoomMessages(roomID), args);
        }
      }
    };
  }
});

var RoomInputType = new _graphql.GraphQLInputObjectType({
  name: 'RoomInput',
  fields: function fields() {
    return {
      name: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
      }
    };
  }
});

var _connectionDefinition2 = (0, _graphqlRelay.connectionDefinitions)({ name: 'Room', nodeType: RoomType });

var RoomConnection = _connectionDefinition2.connectionType;
var RoomEdge = _connectionDefinition2.edgeType;


var UserType = new _graphql.GraphQLObjectType({
  name: 'User',
  fields: function fields() {
    return {
      userID: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
      },
      joinedRooms: {
        type: RoomConnection,
        args: _graphqlRelay.connectionArgs,
        resolve: function resolve(_ref4, args) {
          var userID = _ref4.userID;

          return (0, _graphqlRelay.connectionFromPromisedArray)(getUserJoinedRooms(userID), args);
        }
      }
    };
  }
});

var QueryType = new _graphql.GraphQLObjectType({
  name: 'Query',
  fields: function fields() {
    return {
      viewer: {
        type: UserType,
        args: {
          sessionID: {
            type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
          }
        },
        resolve: function () {
          var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(self, _ref6) {
            var sessionID = _ref6.sessionID;
            var session;
            return _regenerator2.default.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return data.session.read(sessionID);

                  case 2:
                    session = _context.sent;
                    return _context.abrupt('return', session && session.userID ? data.user.read(session.userID) : null);

                  case 4:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, undefined);
          }));

          return function resolve(_x, _x2) {
            return _ref5.apply(this, arguments);
          };
        }()
      }
    };
  }
});

var CreateRoomMutation = (0, _graphqlRelay.mutationWithClientMutationId)({
  name: 'CreateRoom',
  inputFields: {
    sessionID: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
    },
    room: {
      type: new _graphql.GraphQLNonNull(RoomInputType)
    }
  },
  outputFields: {
    roomEdge: {
      type: RoomEdge,
      resolve: function () {
        var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(_ref8) {
          var room = _ref8.room;
          var userID = _ref8.userID;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  return _context2.abrupt('return', {
                    cursor: (0, _graphqlRelay.cursorForObjectInConnection)(getUserJoinedRooms(userID), room),
                    node: room
                  });

                case 1:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, undefined);
        }));

        return function resolve(_x3) {
          return _ref7.apply(this, arguments);
        };
      }()
    },
    viewer: {
      type: UserType,
      resolve: function resolve(_ref9) {
        var userID = _ref9.userID;
        return data.user.read(userID);
      }
    }
  },
  mutateAndGetPayload: function () {
    var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(_ref11) {
      var roomData = _ref11.room;
      var sessionID = _ref11.sessionID;
      var session, exists, room;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return data.session.read(sessionID);

            case 2:
              session = _context3.sent;

              if (session) {
                _context3.next = 5;
                break;
              }

              throw new Error('Invalid sessionID');

            case 5:
              _context3.next = 7;
              return data.roomname.get(roomData.name);

            case 7:
              exists = _context3.sent;

              if (!exists) {
                _context3.next = 10;
                break;
              }

              throw new Error('Room already exists');

            case 10:
              _context3.next = 12;
              return data.room.create(roomData);

            case 12:
              room = _context3.sent;

              if (room) {
                _context3.next = 15;
                break;
              }

              throw new Error('Error creating room');

            case 15:
              _context3.next = 17;
              return _promise2.default.all([data.roomname.set(room.name, room.roomID), data.roomParticipants.add(room.roomID, session.userID), data.userJoinedRooms.add(session.userID, room.roomID)]);

            case 17:
              return _context3.abrupt('return', {
                room: room,
                userID: session.userID
              });

            case 18:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    }));

    return function mutateAndGetPayload(_x4) {
      return _ref10.apply(this, arguments);
    };
  }()
});

var MutationType = new _graphql.GraphQLObjectType({
  name: 'Mutation',
  fields: function fields() {
    return {
      createRoom: CreateRoomMutation
    };
  }
});

exports.default = new _graphql.GraphQLSchema({
  mutation: MutationType,
  query: QueryType
});