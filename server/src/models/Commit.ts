import mongoose, { Schema, Document } from 'mongoose';

export type SentimentTone =
  | 'frustrated'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'urgent';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ICommitAuthor {
  name: string;
  email: string;
  date: Date;
  avatarUrl?: string;
}

export interface ICommitChurn {
  insertions: number;
  deletions: number;
  filesCount: number;
}

export interface ICommitSentiment {
  score: number; // -1.0 to 1.0
  tone: SentimentTone;
  confidence: number; // 0 to 1
  keywords: string[];
  stressIndicator: number; // 0 to 100
}

export interface ICommitRisk {
  probability: number; // 0 to 1
  level: RiskLevel;
  factors: string[];
}

export interface ICommit extends Document {
  repositoryId: mongoose.Types.ObjectId;
  hash: string;
  shortHash: string;
  message: string;
  author: ICommitAuthor;
  authoredDate: Date;
  branch: string;
  churn: ICommitChurn;
  changedFiles?: string[];
  sentiment?: ICommitSentiment;
  bugRisk?: ICommitRisk;
  isInducingCandidate?: boolean;
  status: 'pending' | 'analyzed' | 'skipped';
  createdAt: Date;
  updatedAt: Date;
}

const CommitSchema = new Schema<ICommit>(
  {
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: [true, 'Repository ID is required'],
      index: true,
    },
    hash: {
      type: String,
      required: [true, 'Commit hash is required'],
      trim: true,
      lowercase: true,
    },
    shortHash: {
      type: String,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: [true, 'Commit message is required'],
      trim: true,
    },
    author: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      date: { type: Date, required: true },
      avatarUrl: { type: String, default: '' },
    },
    authoredDate: {
      type: Date,
      required: true,
      index: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    churn: {
      insertions: { type: Number, default: 0, min: 0 },
      deletions: { type: Number, default: 0, min: 0 },
      filesCount: { type: Number, default: 0, min: 0 },
    },
    changedFiles: [{ type: String }],
    sentiment: {
      score: { type: Number, min: -1, max: 1 },
      tone: {
        type: String,
        enum: ['frustrated', 'negative', 'neutral', 'positive', 'urgent'],
      },
      confidence: { type: Number, min: 0, max: 1 },
      keywords: [{ type: String }],
      stressIndicator: { type: Number, min: 0, max: 100 },
    },
    bugRisk: {
      probability: { type: Number, min: 0, max: 1 },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
      },
      factors: [{ type: String }],
    },
    isInducingCandidate: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzed', 'skipped'],
      default: 'pending',
      index: true,
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

// Compound Unique Index: prevents duplicate commits for the same repository
CommitSchema.index({ repositoryId: 1, hash: 1 }, { unique: true });

// Performance index for pagination, time-series, and risk filtering
CommitSchema.index({ repositoryId: 1, authoredDate: -1 });
CommitSchema.index({ repositoryId: 1, 'bugRisk.level': 1 });
CommitSchema.index({ repositoryId: 1, 'sentiment.tone': 1 });

// Automatically compute shortHash before validation if not provided
CommitSchema.pre('validate', function (next) {
  if (this.hash && !this.shortHash) {
    this.shortHash = this.hash.substring(0, 7);
  }
  if (this.author?.date && !this.authoredDate) {
    this.authoredDate = this.author.date;
  }
  next();
});

export const Commit =
  mongoose.models.Commit || mongoose.model<ICommit>('Commit', CommitSchema);
