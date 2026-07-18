// TODO(auth): add API-key middleware to /public/v1 and admin auth to /internal/v1 before production

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { openapiSpec } from './docs/openapi.js';
import { auditLogger } from './middlewares/audit.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

import internalRouter from './routes/internal/index.js';
import publicRouter from './routes/public/index.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API docs (covers /public/v1 only — see docs/openapi.ts)
app.get('/docs-json', (_req, res) => res.json(openapiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Internal admin API — full CRUD, undocumented, no stability guarantees
app.use('/internal/v1', auditLogger, internalRouter);

// Public read-only API — documented, versioned
app.use('/public/v1', publicRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'LumiStock API', docs: '/docs', internal: '/internal/v1/health', public: '/public/v1/health' });
});

app.use(notFoundHandler);
app.use(errorHandler);