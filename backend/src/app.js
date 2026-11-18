import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { env } from './config/env.js';
import { isDatabaseConnected } from './config/database.js';
import analyticsRoutes from './modules/analytics/analytics.route.js';
import authRoutes from './modules/auth/auth.route.js';
import distributionRoutes from './modules/distributions/distribution.route.js';
import foodRoutes from './modules/foods/food.route.js';
import reservationRoutes from './modules/reservations/reservation.route.js';
import usersRoutes from './modules/users/users.route.js';
import verificationRoutes from './modules/verifications/verification.route.js';
import adminVerificationRoutes from './modules/verifications/admin-verification.route.js';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error-handler.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

const docsFilePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/openapi.yaml',
);
const openApiDocument = parseYaml(fs.readFileSync(docsFilePath, 'utf8'));

app.disable('x-powered-by');

app.get('/api/docs.json', (req, res) => {
  res.json(openApiDocument);
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'WasteLess API',
  }),
);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.CLIENT_ORIGIN) {
        return callback(null, true);
      }
      return callback(
        new ApiError(403, 'CORS_FORBIDDEN', 'Origin tidak diizinkan'),
      );
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/admin/verifications', adminVerificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
