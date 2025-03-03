// Create new file: server/routes/index.ts
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to MobifyAI API' });
});

export default router;