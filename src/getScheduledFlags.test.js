jest.mock('./constants', () => ({
  requestHeaders: 'headers',
  launchDarklyFlagsEndpoint: '/some/api/endpoint'
}));

describe('Get scheduled flags', () => {
  const getScheduledFlags = require('./getScheduledFlags').default;

  it('returns scheduled flags correctly', async() => {
    const mockResponse = {items: ['flag1', 'flag2']};
    fetch.mockSuccess(mockResponse);
    const flags = await getScheduledFlags();

    expect(flags).toEqual(mockResponse.items);
  });

  it('returns empty array when the api returns an error', async() => {
    fetch.mockSuccess({}, {status: 401, statusText: 'Unauthorized', url: '/some/api/endpoint'});
    const flags = await getScheduledFlags();

    expect(flags.length).toEqual(0);
  });
});
