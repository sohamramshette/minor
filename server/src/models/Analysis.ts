import mongoose, { Schema, Document } from 'mongoose';

export type AnalysisRunStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface IAnalysisMetrics {
  totalCommits: number;
  highRiskCommits: number;
  averageStressIndex: number;
  correlationScore: number;
  detectedBugOrigins: number;
  mlAccuracy?: string;
}

export interface IAnalysis extends Document {
  repositoryId: mongoose.Types.ObjectId;
  status: AnalysisRunStatus;
  branch: string;
  triggeredBy: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  summaryMetrics?: IAnalysisMetrics;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: [true, 'Repository ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    triggeredBy: {
      type: String,
      default: 'user',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
    },
    summaryMetrics: {
      totalCommits: { type: Number, default: 0 },
      highRiskCommits: { type: Number, default: 0 },
      averageStressIndex: { type: Number, default: 0 },
      correlationScore: { type: Number, default: 0 },
      detectedBugOrigins: { type: Number, default: 0 },
      mlAccuracy: { type: String, default: 'N/A' },
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

AnalysisSchema.index({ repositoryId: 1, createdAt: -1 });

export const Analysis =
  mongoose.models.Analysis ||
  mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export const AnalysisHistory = Analysis;
