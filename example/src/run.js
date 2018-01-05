import ldScheduler from 'ld-scheduler';

ldScheduler.runEveryXSeconds({
  environment: 'test',
  apiKey: 'your-secret-api-key',
  slack: 'your-slack-webhook-url'
});
