import { Router } from 'express';

export const copilotRouter = Router();

copilotRouter.post('/query', (req, res) => {
  const { query, language = 'en' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sampleAnswer = language === 'kn'
    ? 'ರಾಜು ನಾಯಕ್ ಮತ್ತು ದೀಪಕ್ ಕುಮಾರ್ ಅವರ ಮೇಲೆ ಇಂದಿರಾನಗರದಲ್ಲಿ FIR-2024-INDR-0102 ಅಡಿಯಲ್ಲಿ ದರೋಡೆ ಪ್ರಕರಣ ದಾಖಲಾಗಿದೆ.'
    : 'Suspect Raju Nayak is linked to FIR-2024-INDR-0102 (Armed Robbery) and FIR-2024-KRP-0215 (Vehicle Theft KA-04-E-1234).';

  res.write(`data: ${JSON.stringify({ type: 'token', content: sampleAnswer })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: 'done', citedFirNumbers: ['FIR-2024-INDR-0102', 'FIR-2024-KRP-0215'] })}\n\n`);
  res.end();
});
