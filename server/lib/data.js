'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userSessions = exports.userJoinedRooms = exports.userpassword = exports.username = exports.user = exports.session = exports.roomParticipants = exports.roomMessages = exports.roomname = exports.room = exports.message = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _dataloader = require('dataloader');

var _dataloader2 = _interopRequireDefault(_dataloader);

var _ioredis = require('ioredis');

var _ioredis2 = _interopRequireDefault(_ioredis);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redis = (0, _ioredis2.default)({
  keyPrefix: 'sampleapp:'
});

var createValueAccessors = function createValueAccessors(type) {
  var getKey = function getKey(id) {
    return 'value:' + type + ':' + id;
  };

  return {
    delete: function _delete(id) {
      return redis.del(getKey(id));
    },
    get: function get(id) {
      return redis.get(getKey(id));
    },
    set: function set(id, value) {
      return redis.set(getKey(id), value);
    }
  };
};

var createObjectAccessors = function createObjectAccessors(type) {
  var getKey = function getKey(id) {
    return 'object:' + type + ':' + id;
  };

  var loader = new _dataloader2.default(function (ids) {
    var reqs = ids.map(function (id) {
      return ['get', getKey(id)];
    });
    return redis.multi(reqs).exec().then(function (results) {
      return results.map(function (res) {
        return res[1] ? JSON.parse(res[1]) : null;
      });
    });
  });

  var write = function write(id, value) {
    return redis.set(getKey(id), (0, _stringify2.default)(value));
  };

  return {
    create: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(value) {
        var id;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                id = _nodeUuid2.default.v4();

                value[type + 'ID'] = id;
                _context.next = 4;
                return write(id, value);

              case 4:
                return _context.abrupt('return', value);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      return function create(_x) {
        return _ref.apply(this, arguments);
      };
    }(),
    read: function read(id) {
      return loader.load(id);
    },
    update: function update(id, value) {
      return write(id, value);
    },
    delete: function _delete(id) {
      return redis.del(getKey(id));
    }
  };
};

var createLinkAccessors = function createLinkAccessors(fromType, linkType) {
  var getKey = function getKey(id) {
    return 'link:' + fromType + ':' + id + '->' + linkType;
  };

  return {
    add: function add(from, to) {
      return redis.zadd(getKey(from), Date.now(), to);
    },
    getRange: function getRange(from) {
      var start = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var stop = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

      return redis.zrange(getKey(from), start, stop);
    },
    remove: function remove(from, to) {
      return redis.zrem(getKey(from), to);
    }
  };
};

var message = exports.message = createObjectAccessors('message');

var room = exports.room = createObjectAccessors('room');
var roomname = exports.roomname = createValueAccessors('roomname');
var roomMessages = exports.roomMessages = createLinkAccessors('room', 'messages');
var roomParticipants = exports.roomParticipants = createLinkAccessors('room', 'users');

var session = exports.session = createObjectAccessors('session');

var user = exports.user = createObjectAccessors('user');
var username = exports.username = createValueAccessors('username');
var userpassword = exports.userpassword = createValueAccessors('userpassword');
var userJoinedRooms = exports.userJoinedRooms = createLinkAccessors('user', 'rooms');
var userSessions = exports.userSessions = createLinkAccessors('user', 'sessions');