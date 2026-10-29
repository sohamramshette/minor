import { Router } from 'express';
import {
  listAnalyses,
  getAnalysisById,
  createAnalysis,
} from '../controllers/analysisController.js';
import { requireDatabase, validateObjectId } from '../middleware/dbCheck.js';

const router = Router();

// Ensure database connection is active before running queries
router.use(requireDatabase);

router.get('/', listAnalyses);
router.post('/', createAnalysis);
router.get('/:id', validateObjectId('id'), getAnalysisById);

export default router;
