'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _getRequestHeaders = require('./getRequestHeaders');

var _getRequestHeaders2 = _interopRequireDefault(_getRequestHeaders);

var _without = require('lodash/without');

var _without2 = _interopRequireDefault(_without);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_ref2, apiKey) {
    var key = _ref2.key,
        tags = _ref2.tags,
        description = _ref2.description;
    var body, url, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            body = JSON.stringify([{
              op: 'replace',
              path: '/tags',
              value: (0, _without2.default)(tags, 'scheduled')
            }, {
              op: 'replace',
              path: '/description',
              value: description
            }]);
            url = '' + _config2.default.launchDarkly.rest.baseUrl + _config2.default.launchDarkly.rest.flags + '/' + key;
            _context.prev = 2;
            _context.next = 5;
            return fetch(url, {
              method: 'PATCH',
              headers: (0, _getRequestHeaders2.default)(apiKey),
              body: body
            });

          case 5:
            response = _context.sent;


            console.log('completeFlagDeployment: LaunchDarkly api response: ' + response.status + ' ' + response.statusText + ' from: ' + response.url);

            if (response.status === 200) {
              console.log('completeFlagDeployment: SUCCESS LD api! Updated ' + key + ' to ' + body + '.');
            } else {
              console.log('completeFlagDeployment: LaunchDarkly threw an error. Did not update ' + key + '. Will retry again later.');
            }
            _context.next = 13;
            break;

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](2);

            console.log('completeFlagDeployment: Network error. Could not reach LaunchDarkly. Did not update ' + key + '. Will retry again later. ' + _context.t0);

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 10]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();