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

describe('Get scheduled flags', () => {
  const getScheduledFlags = require('./getScheduledFlags').default;

  it('returns scheduled flags correctly', async() => {
    const mockResponse = {items: ['flag1', 'flag2']};
    fetch.mockSuccess(mockResponse);
    const flags = await getScheduledFlags();

    expect(flags).toEqual(mockResponse.items);
  });

  it('returns empty array when an error occurs', async() => {
    fetch.mockSuccess({}, {status: 401, statusText: 'Unauthorized'});
    const flags = await getScheduledFlags();

    expect(flags.length).toEqual(0);
  });
});
