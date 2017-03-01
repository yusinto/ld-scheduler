jest.mock('config', () => ({
  launchDarkly: {
    environment: 'test',
    rest: {
      baseUrl: 'mockBaseUrl',
      flags: '/flags',
    }
  }
}));
jest.mock('./constants', () => ({requestHeaders: 'headers'}));

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
