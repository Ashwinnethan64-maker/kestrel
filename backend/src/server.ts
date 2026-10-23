import express from 'express';
import cors from 'cors';
import { config } from './config';
import { casesRouter } from './routes/cases';
import { spatialRouter } from './routes/spatial';
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

// Mounted Routes
app.use('/api/cases', casesRouter);
app.use('/api/spatial', spatialRouter);
app.use('/api/copilot', copilotRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[Kestrel Backend] Intelligence Gateway listening on http://localhost:${config.port}`);
  });
}
