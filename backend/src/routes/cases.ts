import { Router } from 'express';
import { curatedCrimeDataset } from '@kestrel/shared';
import type { FIRCase } from '@kestrel/shared';

export const casesRouter = Router();

casesRouter.get('/', (req, res) => {
  const { policeStation, priority, crimeCategory } = req.query;
  let cases: FIRCase[] = [...(curatedCrimeDataset.cases as FIRCase[])];

  if (policeStation) {
    cases = cases.filter((c) => c.policeStation.toLowerCase() === String(policeStation).toLowerCase());
  }
  if (priority) {
    cases = cases.filter((c) => c.priority === priority);
  }
  if (crimeCategory) {
    cases = cases.filter((c) => c.crimeCategory.toLowerCase().includes(String(crimeCategory).toLowerCase()));
  }

  res.json({
    success: true,
    data: cases,
    meta: { total: cases.length, timestamp: new Date().toISOString() }
  });
});

casesRouter.get('/:id', (req, res) => {
  const cases = curatedCrimeDataset.cases as FIRCase[];
  const found = cases.find((c) => c.id === req.params.id || c.firNumber === req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }
  res.json({ success: true, data: found });
});
