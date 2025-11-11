import basicAuth from 'express-basic-auth';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './logger.js';
import { router } from './routes/index.js';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  pinoHttp({
    logger,
  }),
);

app.use(
  basicAuth({
    users: { [env.ADMIN_LOGIN]: env.ADMIN_PASSWORD },
    challenge: true,
  }),
);

app.use('/api', router);

app.use(
  (error: unknown, _req: express.Request, res: express.Response) => {
    logger.error({ error }, 'Unhandled error');
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  },
);

