import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  if (env.MONGODB_URI) await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
