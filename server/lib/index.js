'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _crypt = require('./crypt');

var _data = require('./data');

var data = _interopRequireWildcard(_data);

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = (0, _express2.default)();

server.use('/graphql', (0, _expressGraphql2.default)({
  graphiql: true,
  schema: _schema2.default
}));

server.use(_bodyParser2.default.json());

server.post('/login', function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(req, res) {
    var userID, password, valid, session;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!req.body.username || !req.body.password)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', res.status(400).send({ error: 'Missing credentials' }));

          case 2:
            userID = void 0;
            _context.prev = 3;
            _context.next = 6;
            return data.username.get(req.body.username);

          case 6:
            userID = _context.sent;
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](3);
            return _context.abrupt('return', res.status(400).send({ error: 'Unknown username' }));

          case 12:
            _context.next = 14;
            return data.userpassword.get(userID);

          case 14:
            password = _context.sent;
            _context.next = 17;
            return (0, _crypt.compare)(req.body.password, password);

          case 17:
            valid = _context.sent;

            if (!valid) {
              _context.next = 25;
              break;
            }

            _context.next = 21;
            return data.session.create({ userID: userID });

          case 21:
            session = _context.sent;

            res.send(session);
            _context.next = 26;
            break;

          case 25:
            res.status(400).send({ error: 'Bad password' });

          case 26:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[3, 9]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

server.post('/logout', function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(req, res) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return data.session.delete(req.body.sessionID);

          case 2:
            res.sendStatus(204);

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

server.post('/register', function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(req, res) {
    var _req$body, password, body, exists, _ref4, _ref5, user, passwordHash, _ref6, _ref7, sessionID;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _req$body = req.body;
            password = _req$body.password;
            body = (0, _objectWithoutProperties3.default)(_req$body, ['password']);

            if (!(!password || !body.username)) {
              _context3.next = 5;
              break;
            }

            return _context3.abrupt('return', res.status(400).send({ error: 'Missing credentials' }));

          case 5:
            _context3.next = 7;
            return data.username.get(body.username);

          case 7:
            exists = _context3.sent;

            if (!exists) {
              _context3.next = 10;
              break;
            }

            return _context3.abrupt('return', res.status(400).send({ error: 'Unavailable username' }));

          case 10:
            _context3.next = 12;
            return _promise2.default.all([data.user.create(body), (0, _crypt.hash)(password)]);

          case 12:
            _ref4 = _context3.sent;
            _ref5 = (0, _slicedToArray3.default)(_ref4, 2);
            user = _ref5[0];
            passwordHash = _ref5[1];
            _context3.next = 18;
            return _promise2.default.all([data.session.create({ userID: user.userID }), data.username.set(body.username, user.userID), data.userpassword.set(user.userID, passwordHash)]);

          case 18:
            _ref6 = _context3.sent;
            _ref7 = (0, _slicedToArray3.default)(_ref6, 1);
            sessionID = _ref7[0];

            res.send({ sessionID: sessionID });

          case 22:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

server.listen(3000);