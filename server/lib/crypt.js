'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hash = exports.compare = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var compare = exports.compare = function compare(str, hash) {
  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.compare(str, hash, function (err, res) {
      if (err) reject(err);else resolve(res);
    });
  });
};

var hash = exports.hash = function hash(str) {
  var salt = arguments.length <= 1 || arguments[1] === undefined ? 8 : arguments[1];

  return new _promise2.default(function (resolve, reject) {
    _bcrypt2.default.hash(str, salt, function (err, res) {
      if (err) reject(err);else resolve(res);
    });
  });
};