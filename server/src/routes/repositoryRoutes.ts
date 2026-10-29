import { Router } from 'express';
import {
  listRepositories,
  getRepositoryById,
  getRepositoryCommits,
  createRepository,
} from '../controllers/repositoryController.js';
import { requireDatabase, validateObjectId } from '../middleware/dbCheck.js';

const router = Router();

// Ensure database connection is active before running queries
router.use(requireDatabase);

router.get('/', listRepositories);
router.post('/', createRepository);
router.get('/:id', validateObjectId('id'), getRepositoryById);
router.get('/:id/commits', validateObjectId('id'), getRepositoryCommits);

export default router;
