'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('isomorphic-fetch');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _cronJob = require('./cronJob');

var _cronJob2 = _interopRequireDefault(_cronJob);

var _scheduler = require('./scheduler');

var _scheduler2 = _interopRequireDefault(_scheduler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.Promise = _bluebird2.default;

exports.default = {
  runOnce: _scheduler2.default,
  runEveryXSeconds: _cronJob2.default
};