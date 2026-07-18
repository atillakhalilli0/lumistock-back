import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LumiStock Public API',
      version: '1.0.0',
      description:
        'Read-only catalog, stock, and order-status API for external platform integrations. ' +
        'No API key required in v1 (open, matching the rest of the app for now).',
    },
    servers: [{ url: `http://localhost:${env.PORT}/public/v1` }],
  },
  apis: ['./src/routes/public/*.ts'],
});