'use strict';

var _getRequestHeaders = require('./getRequestHeaders');

var _getRequestHeaders2 = _interopRequireDefault(_getRequestHeaders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
jest.mock('./getRequestHeaders', function () {
  return global.td.function('mockGetRequestHeaders');
});

describe('Complete flag deployment', function () {
  var completeFlagDeployment = require('./completeFlagDeployment').default;
  var expectedJsonPatchBody = JSON.stringify([{
    op: 'replace',
    path: '/tags',
    value: ['non-scheduled']
  }, {
    op: 'replace',
    path: '/description',
    value: 'this is a test flag'
  }]);

  beforeEach(function () {
    fetch.mockSuccess();
    td.when((0, _getRequestHeaders2.default)(td.matchers.anything())).thenReturn('headers');
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  it('returns scheduled flags correctly', _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return completeFlagDeployment({
              key: 'test-flag',
              tags: ['non-scheduled', 'scheduled'],
              description: 'this is a test flag'
            });

          case 2:

            expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/test-flag', {
              method: 'PATCH',
              headers: 'headers',
              body: expectedJsonPatchBody
            });

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
});