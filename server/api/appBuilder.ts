import express from 'express';

const router = express.Router();

// App builder routes - placeholder until implementation
router.get('/', (req, res) => {
  res.json({ message: 'App Builder API - placeholder' });
});

export default router;