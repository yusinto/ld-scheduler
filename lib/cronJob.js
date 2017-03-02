'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _scheduler = require('./scheduler');

var _scheduler2 = _interopRequireDefault(_scheduler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var POLL_INTERVAL_SECONDS = 60; // 1 minute

var cronJob = function cronJob(_ref) {
  var ldEnvironment = _ref.ldEnvironment,
      apiKey = _ref.apiKey,
      slackWebhook = _ref.slackWebhook;

  console.log((0, _moment2.default)().format('YYYY-MM-DD HH:mm:ss') + ' ld-scheduler started in ld.environment: ' + ldEnvironment);
  (0, _scheduler2.default)({ ldEnvironment: ldEnvironment, apiKey: apiKey, slackWebhook: slackWebhook });

  setInterval(function () {
    (0, _scheduler2.default)({ ldEnvironment: ldEnvironment, apiKey: apiKey, slackWebhook: slackWebhook });
  }, POLL_INTERVAL_SECONDS * 1000);
};

exports.default = cronJob;