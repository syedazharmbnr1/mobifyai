import express from 'express';

const router = express.Router();

// Preview routes - placeholder until implementation
router.get('/', (req, res) => {
  res.json({ message: 'Preview API - placeholder' });
});

export default router;