jest.mock('./constants', () => ({
  launchDarklyFlagsEndpoint: 'mockBaseUrl/flags',
}));
jest.mock('./getRequestHeaders', () => global.td.function('mockGetRequestHeaders'));

import getRequestHeaders from './getRequestHeaders';

describe('Complete flag deployment', () => {
  const completeFlagDeployment = require('./completeFlagDeployment').default;

  beforeEach(() => {
    fetch.mockSuccess();
    td.when(getRequestHeaders(td.matchers.anything())).thenReturn('headers');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns scheduled flags correctly when there are additional remaining scheduled flags', async () => {
    const expectedJsonPatchBody = JSON.stringify([
      {
        op: 'replace',
        path: '/tags',
        value: ['some-other-env-scheduled'],
      },
      {
        op: 'replace',
        path: '/description',
        value: JSON.stringify({
          test: 'test',
          __isDeployed: true,
        }),
      },
    ]);

    await completeFlagDeployment(
      {
        key: 'test-flag',
        tags: ['some-other-env-scheduled', 'test-scheduled'],
        description: {
          test: 'test',
        },
      },
      'test',
    );

    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/test-flag', {
      method: 'PATCH',
      headers: 'headers',
      body: expectedJsonPatchBody,
    });
  });

  it('returns scheduled flags correctly when there are no remaining scheduled flags', async () => {
    const expectedJsonPatchBody = JSON.stringify([
      {
        op: 'replace',
        path: '/tags',
        value: ['some-other-tag-that-doesnt-end-with-scheduled-and-ends-with-something-else'],
      },
      {
        op: 'replace',
        path: '/description',
        value: JSON.stringify({
          test: 'test',
          __isDeployed: true,
        }),
      },
    ]);

    await completeFlagDeployment(
      {
        key: 'test-flag',
        tags: ['some-other-tag-that-doesnt-end-with-scheduled-and-ends-with-something-else', 'test-scheduled'],
        description: {
          test: 'test',
        },
      },
      'test',
    );

    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/test-flag', {
      method: 'PATCH',
      headers: 'headers',
      body: expectedJsonPatchBody,
    });
  });
});
