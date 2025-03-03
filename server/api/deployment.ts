import express from 'express';

const router = express.Router();

// Deployment routes - placeholder until implementation
router.get('/', (req, res) => {
  res.json({ message: 'Deployment API - placeholder' });
});

export default router;