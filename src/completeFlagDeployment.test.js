jest.mock('./constants', () => ({
  launchDarklyFlagsEndpoint: 'mockBaseUrl/flags'
}));
jest.mock('./getRequestHeaders', () => global.td.function('mockGetRequestHeaders'));

import getRequestHeaders from './getRequestHeaders';

describe('Complete flag deployment', () => {
  const completeFlagDeployment = require('./completeFlagDeployment').default;
  const expectedJsonPatchBody = JSON.stringify([
    {
      op: 'replace',
      path: '/tags',
      value: ['non-scheduled'],
    },
    {
      op: 'replace',
      path: '/description',
      value: 'this is a test flag',
    }
  ]);

  beforeEach(() => {
    fetch.mockSuccess();
    td.when(getRequestHeaders(td.matchers.anything())).thenReturn('headers');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns scheduled flags correctly', async() => {
    await completeFlagDeployment({
      key: 'test-flag',
      tags: ['non-scheduled', 'scheduled'],
      description: 'this is a test flag'
    });

    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/test-flag', {
      method: 'PATCH',
      headers: 'headers',
      body: expectedJsonPatchBody
    });
  });
});
