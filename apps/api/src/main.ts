import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`🚀 Reservy API Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
  console.log(`📍 Health Check: http://localhost:${ENV.PORT}/health`);
});
