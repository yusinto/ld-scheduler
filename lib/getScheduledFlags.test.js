'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

jest.mock('config', function () {
  return {
    launchDarkly: {
      environment: 'test',
      rest: {
        baseUrl: 'mockBaseUrl',
        flags: '/flags'
      }
    }
  };
});
jest.mock('./constants', function () {
  return { requestHeaders: 'headers' };
});

describe('Get scheduled flags', function () {
  var getScheduledFlags = require('./getScheduledFlags').default;

  it('returns scheduled flags correctly', _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var mockResponse, flags;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mockResponse = { items: ['flag1', 'flag2'] };

            fetch.mockSuccess(mockResponse);
            _context.next = 4;
            return getScheduledFlags();

          case 4:
            flags = _context.sent;


            expect(flags).toEqual(mockResponse.items);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  it('returns empty array when the api returns an error', _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var flags;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            fetch.mockSuccess({}, { status: 401, statusText: 'Unauthorized' });
            _context2.next = 3;
            return getScheduledFlags();

          case 3:
            flags = _context2.sent;


            expect(flags.length).toEqual(0);

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
});