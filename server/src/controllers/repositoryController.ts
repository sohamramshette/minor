import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Repository } from '../models/Repository.js';
import { Commit } from '../models/Commit.js';
import { Analysis } from '../models/Analysis.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { PaginatedResponse } from '../types/index.js';
import {
  parseGitHubUrl,
  fetchRepositoryMetadata,
  fetchRepositoryCommits,
  GitHubError,
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubAuthError,
} from '../services/githubService.js';

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

/**
 * Phase 3: Analyze and ingest real GitHub repository metadata and commits into MongoDB.
 * POST /api/repositories/analyze
 */
export async function analyzeRepository(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { url, branch, maxCommits } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      ApiResponse.error(res, 'GitHub repository URL is required.', 400);
      return;
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      ApiResponse.error(
        res,
        `Invalid GitHub repository URL format: '${url}'. Expected format like 'https://github.com/owner/repo' or 'owner/repo'.`,
        400
      );
      return;
    }

    const { owner, repo } = parsed;
    const fullName = `${owner}/${repo}`.toLowerCase();
    const targetBranch = branch && typeof branch === 'string' ? branch.trim() : undefined;
    const limit = Math.min(100, Math.max(1, parseInt(maxCommits as string, 10) || 30));

    // 1. Fetch GitHub metadata
    let metadata;
    try {
      metadata = await fetchRepositoryMetadata(owner, repo);
    } catch (githubErr: any) {
      if (githubErr instanceof GitHubNotFoundError) {
        ApiResponse.error(res, githubErr.message, 404);
        return;
      }
      if (githubErr instanceof GitHubRateLimitError) {
        ApiResponse.error(res, githubErr.message, 403);
        return;
      }
      if (githubErr instanceof GitHubAuthError) {
        ApiResponse.error(res, githubErr.message, 401);
        return;
      }
      if (githubErr instanceof GitHubError) {
        ApiResponse.error(res, githubErr.message, githubErr.statusCode);
        return;
      }
      throw githubErr;
    }

    // 2. Find or register repository in MongoDB
    let repository = await Repository.findOne({ fullName });

    if (repository) {
      repository.githubUrl = metadata.githubUrl;
      repository.owner = metadata.owner;
      repository.name = metadata.name;
      repository.defaultBranch = targetBranch || metadata.defaultBranch || repository.defaultBranch;
      repository.metadata = {
        description: metadata.description,
        language: metadata.language,
        stars: metadata.stars,
        forks: metadata.forks,
        openIssues: metadata.openIssues,
        sizeKb: metadata.sizeKb,
        topics: metadata.topics,
        isPrivate: metadata.isPrivate,
      };
      repository.status = 'analyzing';
      repository.lastError = undefined;
      await repository.save();
    } else {
      repository = await Repository.create({
        fullName,
        githubUrl: metadata.githubUrl,
        owner: metadata.owner,
        name: metadata.name,
        defaultBranch: targetBranch || metadata.defaultBranch || 'main',
        metadata: {
          description: metadata.description,
          language: metadata.language,
          stars: metadata.stars,
          forks: metadata.forks,
          openIssues: metadata.openIssues,
          sizeKb: metadata.sizeKb,
          topics: metadata.topics,
          isPrivate: metadata.isPrivate,
        },
        status: 'analyzing',
      });
    }

    // 3. Register Analysis Run
    const analysis = await Analysis.create({
      repositoryId: repository._id,
      status: 'in_progress',
      branch: repository.defaultBranch,
      triggeredBy: 'user',
      startedAt: new Date(),
    });

    // 4. Retrieve Commits from GitHub and Persist in MongoDB
    try {
      const commitItems = await fetchRepositoryCommits(owner, repo, {
        perPage: limit,
        branch: repository.defaultBranch,
      });

      let newlyIngestedCount = 0;

      if (commitItems.length > 0) {
        const bulkOps = commitItems.map((c) => ({
          updateOne: {
            filter: {
              repositoryId: repository._id,
              hash: c.hash.toLowerCase(),
            },
            update: {
              $setOnInsert: {
                repositoryId: repository._id,
                hash: c.hash.toLowerCase(),
                shortHash: c.shortHash.toLowerCase(),
                message: c.message,
                author: c.author,
                authoredDate: c.authoredDate,
                branch: c.branch || repository.defaultBranch,
                churn: c.churn,
                changedFiles: c.changedFiles,
                status: 'pending',
                isInducingCandidate: false,
              },
            },
            upsert: true,
          },
        }));

        const bulkResult = await Commit.bulkWrite(bulkOps, { ordered: false });
        newlyIngestedCount = bulkResult.upsertedCount;
      }

      const totalRepoCommits = await Commit.countDocuments({ repositoryId: repository._id });

      // Mark repository analysis completed
      repository.status = 'completed';
      repository.analyzedAt = new Date();
      repository.lastError = undefined;
      await repository.save();

      // Mark analysis completed
      const completedAt = new Date();
      analysis.status = 'completed';
      analysis.completedAt = completedAt;
      analysis.durationMs = completedAt.getTime() - analysis.startedAt.getTime();
      analysis.summaryMetrics = {
        totalCommits: totalRepoCommits,
        highRiskCommits: 0,
        averageStressIndex: 0,
        correlationScore: 0,
        detectedBugOrigins: 0,
      };
      await analysis.save();

      ApiResponse.success(
        res,
        {
          repository,
          analysis,
          commitsIngested: newlyIngestedCount,
          totalCommits: totalRepoCommits,
          batchSize: commitItems.length,
        },
        `Repository '${repository.fullName}' ingested successfully (${newlyIngestedCount} new commits stored, ${totalRepoCommits} total in database).`,
        200
      );
    } catch (ingestionErr: any) {
      repository.status = 'failed';
      repository.lastError = ingestionErr.message;
      await repository.save();

      analysis.status = 'failed';
      analysis.error = ingestionErr.message;
      await analysis.save();

      if (ingestionErr instanceof GitHubRateLimitError) {
        ApiResponse.error(res, ingestionErr.message, 403);
        return;
      }
      if (ingestionErr instanceof GitHubNotFoundError) {
        ApiResponse.error(res, ingestionErr.message, 404);
        return;
      }
      if (ingestionErr instanceof GitHubError) {
        ApiResponse.error(res, ingestionErr.message, ingestionErr.statusCode);
        return;
      }

      throw ingestionErr;
    }
  } catch (error) {
    next(error);
  }
}
