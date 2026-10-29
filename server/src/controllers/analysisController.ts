import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis.js';
import { Repository } from '../models/Repository.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { PaginatedResponse } from '../types/index.js';

export async function listAnalyses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (req.query.repositoryId) {
      const repoId = req.query.repositoryId as string;
      if (!mongoose.Types.ObjectId.isValid(repoId)) {
        ApiResponse.error(
          res,
          "Invalid 'repositoryId' query parameter: must be a 24-character hexadecimal ObjectId.",
          400
        );
        return;
      }
      filter.repositoryId = new mongoose.Types.ObjectId(repoId);
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [total, analyses] = await Promise.all([
      Analysis.countDocuments(filter),
      Analysis.find(filter)
        .populate('repositoryId', 'fullName owner name defaultBranch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const responseData: PaginatedResponse<any> = {
      items: analyses,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    ApiResponse.success(
      res,
      responseData,
      analyses.length === 0
        ? 'No analysis runs found matching criteria.'
        : `Successfully retrieved ${analyses.length} analysis runs.`
    );
  } catch (error) {
    next(error);
  }
}

export async function getAnalysisById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const analysis = await Analysis.findById(id)
      .populate('repositoryId', 'fullName owner name defaultBranch githubUrl metadata')
      .lean();

    if (!analysis) {
      ApiResponse.error(res, `Analysis record with ID '${id}' not found.`, 404);
      return;
    }

    ApiResponse.success(res, analysis, 'Analysis record retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { repositoryId, branch, triggeredBy, summaryMetrics, status, error } = req.body;

    if (!repositoryId || !mongoose.Types.ObjectId.isValid(repositoryId)) {
      ApiResponse.error(
        res,
        "Validation failed: valid 'repositoryId' is required.",
        400
      );
      return;
    }

    const repoExists = await Repository.exists({ _id: repositoryId });
    if (!repoExists) {
      ApiResponse.error(
        res,
        `Repository with ID '${repositoryId}' does not exist.`,
        404
      );
      return;
    }

    const analysis = await Analysis.create({
      repositoryId: new mongoose.Types.ObjectId(repositoryId),
      branch: branch || 'main',
      triggeredBy: triggeredBy || 'manual',
      status: status || 'pending',
      summaryMetrics: summaryMetrics || {},
      error,
      startedAt: new Date(),
    });

    ApiResponse.success(
      res,
      analysis,
      'Analysis run initialized successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
}
