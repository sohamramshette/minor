import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import repositoryRoutes from './repositoryRoutes.js';
import analysisRoutes from './analysisRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/repositories', repositoryRoutes);
apiRouter.use('/analyses', analysisRoutes);

export default apiRouter;
