export default (apiKey) => ({
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: apiKey,
  'accept-encoding': 'gzip, deflate'
});
