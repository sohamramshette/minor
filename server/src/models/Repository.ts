import mongoose, { Schema, Document } from 'mongoose';

export type RepositoryAnalysisStatus =
  | 'idle'
  | 'pending'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface IRepositoryMetadata {
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  sizeKb?: number;
  topics?: string[];
  isPrivate?: boolean;
}

export interface IRepository extends Document {
  githubUrl: string;
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  metadata: IRepositoryMetadata;
  status: RepositoryAnalysisStatus;
  analyzedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
  {
    githubUrl: {
      type: String,
      required: [true, 'GitHub URL is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Repository full name (owner/repo) is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    owner: {
      type: String,
      required: [true, 'Repository owner is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Repository name is required'],
      trim: true,
    },
    defaultBranch: {
      type: String,
      default: 'main',
      trim: true,
    },
    metadata: {
      description: { type: String, default: '' },
      language: { type: String, default: 'JavaScript' },
      stars: { type: Number, default: 0, min: 0 },
      forks: { type: Number, default: 0, min: 0 },
      openIssues: { type: Number, default: 0, min: 0 },
      sizeKb: { type: Number, default: 0 },
      topics: [{ type: String }],
      isPrivate: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['idle', 'pending', 'analyzing', 'completed', 'failed'],
      default: 'idle',
      index: true,
    },
    analyzedAt: {
      type: Date,
    },
    lastError: {
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

// Helpful compound indexes for queries
RepositorySchema.index({ owner: 1, name: 1 });
RepositorySchema.index({ createdAt: -1 });

export const Repository =
  mongoose.models.Repository ||
  mongoose.model<IRepository>('Repository', RepositorySchema);
