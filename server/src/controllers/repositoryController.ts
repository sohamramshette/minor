import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Repository } from '../models/Repository.js';
import { Commit } from '../models/Commit.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { PaginatedResponse } from '../types/index.js';

export async function listRepositories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { owner: searchRegex },
        { name: searchRegex },
        { 'metadata.description': searchRegex },
      ];
    }

    const [total, repositories] = await Promise.all([
      Repository.countDocuments(filter),
      Repository.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const responseData: PaginatedResponse<any> = {
      items: repositories,
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
      repositories.length === 0
        ? 'No repositories found matching criteria.'
        : `Successfully retrieved ${repositories.length} repositories.`
    );
  } catch (error) {
    next(error);
  }
}

export async function getRepositoryById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const repository = await Repository.findById(id).lean();

    if (!repository) {
      ApiResponse.error(res, `Repository with ID '${id}' not found.`, 404);
      return;
    }

    // Include quick commit count stats for convenience
    const commitCount = await Commit.countDocuments({ repositoryId: id });

    ApiResponse.success(
      res,
      {
        ...repository,
        commitCount,
      },
      'Repository details retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
}

export async function getRepositoryCommits(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    // Verify repository exists
    const repoExists = await Repository.exists({ _id: id });
    if (!repoExists) {
      ApiResponse.error(res, `Repository with ID '${id}' not found.`, 404);
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { repositoryId: new mongoose.Types.ObjectId(id) };

    if (req.query.riskLevel) {
      filter['bugRisk.level'] = req.query.riskLevel;
    }

    if (req.query.sentimentTone) {
      filter['sentiment.tone'] = req.query.sentimentTone;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
      filter.$or = [
        { message: searchRegex },
        { 'author.name': searchRegex },
        { 'author.email': searchRegex },
        { hash: searchRegex },
        { shortHash: searchRegex },
      ];
    }

    const [total, commits] = await Promise.all([
      Commit.countDocuments(filter),
      Commit.find(filter)
        .sort({ authoredDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const responseData: PaginatedResponse<any> = {
      items: commits,
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
      `Successfully retrieved ${commits.length} commits for repository.`
    );
  } catch (error) {
    next(error);
  }
}

export async function createRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, githubUrl, owner, name, defaultBranch, metadata } = req.body;

    if (!fullName || !githubUrl) {
      ApiResponse.error(
        res,
        'Missing required fields: fullName and githubUrl are required.',
        400
      );
      return;
    }

    const existing = await Repository.findOne({ fullName: fullName.toLowerCase() });
    if (existing) {
      ApiResponse.error(
        res,
        `Repository '${fullName}' is already registered with ID '${existing._id}'.`,
        409
      );
      return;
    }

    const parts = fullName.split('/');
    const repoOwner = owner || parts[0];
    const repoName = name || parts[1] || fullName;

    const repository = await Repository.create({
      fullName: fullName.toLowerCase(),
      githubUrl,
      owner: repoOwner,
      name: repoName,
      defaultBranch: defaultBranch || 'main',
      metadata: metadata || {},
      status: 'idle',
    });

    ApiResponse.success(
      res,
      repository,
      'Repository registered successfully.',
      201
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      ApiResponse.error(res, 'Repository with this name already exists.', 409);
      return;
    }
    next(error);
  }
}
