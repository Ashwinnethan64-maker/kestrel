import express from 'express';
import cors from 'cors';
import { config } from './config';
import { casesRouter } from './routes/cases';
import { spatialRouter } from './routes/spatial';
import { accusedRouter } from './routes/accused';
import { networkRouter } from './routes/network';
import { analyticsRouter } from './routes/analytics';
import { copilotRouter } from './routes/copilot';

export const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kestrel-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mounted Operational Intelligence Routes
app.use('/api/cases', casesRouter);
app.use('/api/spatial', spatialRouter);
app.use('/api/accused', accusedRouter);
app.use('/api/network', networkRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/copilot', copilotRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[Kestrel Backend] Intelligence Gateway listening on http://localhost:${config.port}`);
  });
}
