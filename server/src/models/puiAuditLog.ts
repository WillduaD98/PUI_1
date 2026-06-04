import mongoose, { Schema } from 'mongoose';

export type PuiAuditLog = {
  requestId: string;
  companyId: string;
  endpoint: string;
  source: 'PUI';
  method: string;
  httpStatus: number;
  matched?: boolean;
  matchCount?: number;
  curpHash?: string;
  durationMs: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};

const puiAuditLogSchema = new Schema<PuiAuditLog>(
  {
    requestId: { type: String, required: true, index: true, unique: true },
    companyId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    source: { type: String, required: true },
    method: { type: String, required: true },
    httpStatus: { type: Number, required: true },
    matched: { type: Boolean, required: false },
    matchCount: { type: Number, required: false },
    curpHash: { type: String, required: false },
    durationMs: { type: Number, required: true },
    errorMessage: { type: String, required: false }
  },
  { timestamps: true }
);

export const PuiAuditLogModel =
  (mongoose.models.PuiAuditLog as mongoose.Model<PuiAuditLog> | undefined) ??
  mongoose.model<PuiAuditLog>('PuiAuditLog', puiAuditLogSchema);
