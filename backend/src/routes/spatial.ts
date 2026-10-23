import { Router } from 'express';
import { curatedCrimeDataset } from '@kestrel/shared';
import type { FIRCase } from '@kestrel/shared';

export const spatialRouter = Router();

spatialRouter.get('/incidents', (req, res) => {
  const { south, west, north, east } = req.query;
  let result: FIRCase[] = [...(curatedCrimeDataset.cases as FIRCase[])];

  if (south && west && north && east) {
    const s = parseFloat(String(south));
    const w = parseFloat(String(west));
    const n = parseFloat(String(north));
    const e = parseFloat(String(east));
    result = result.filter(
      (c) => c.latitude >= s && c.latitude <= n && c.longitude >= w && c.longitude <= e
    );
  }

  res.json({
    success: true,
    data: result,
    meta: { total: result.length, timestamp: new Date().toISOString() }
  });
});
