'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ldScheduler = undefined;

require('isomorphic-fetch');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _cronJob = require('./cronJob');

var _cronJob2 = _interopRequireDefault(_cronJob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.Promise = _bluebird2.default;

var ldScheduler = exports.ldScheduler = _cronJob2.default;
exports.default = {
  ldScheduler: _cronJob2.default
};