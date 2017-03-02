'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _getRequestHeaders = require('./getRequestHeaders');

var _getRequestHeaders2 = _interopRequireDefault(_getRequestHeaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// list all scheduled flags in the default project
exports.default = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ldEnvironment, apiKey) {
    var url, response, data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            url = '' + _config2.default.launchDarkly.rest.baseUrl + _config2.default.launchDarkly.rest.flags + '?env=' + ldEnvironment + '&tag=scheduled';
            _context.prev = 1;
            _context.next = 4;
            return fetch(url, {
              method: 'GET',
              headers: (0, _getRequestHeaders2.default)(apiKey)
            });

          case 4:
            response = _context.sent;

            if (!(response.status === 200)) {
              _context.next = 10;
              break;
            }

            _context.next = 8;
            return response.json();

          case 8:
            data = _context.sent;
            return _context.abrupt('return', data.items);

          case 10:

            console.log('getScheduledFlag ERROR: api response: ' + response.status + ' ' + response.statusText + ' from: ' + response.url);
            return _context.abrupt('return', []);

          case 14:
            _context.prev = 14;
            _context.t0 = _context['catch'](1);

            console.log('getScheduledFlags EXCEPTION: ' + _context.t0 + '. Will retry again later.');
            return _context.abrupt('return', []);

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[1, 14]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();