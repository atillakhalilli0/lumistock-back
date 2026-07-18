import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 LumiStock API listening on http://localhost:${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Public API docs: http://localhost:${env.PORT}/docs`);
});