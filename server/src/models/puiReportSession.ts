import mongoose, { Schema } from 'mongoose';

export type PuiReportSessionStatus = 'active' | 'inactive';

export type PuiReportSession = {
  companyId: string;
  puiId: string;
  curp: string;
  status: PuiReportSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
};

const puiReportSessionSchema = new Schema<PuiReportSession>(
  {
    companyId: { type: String, required: true, index: true },
    puiId: { type: String, required: true, index: true },
    curp: { type: String, required: true },
    status: { type: String, required: true },
    activatedAt: { type: Date, required: false },
    deactivatedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

puiReportSessionSchema.index({ companyId: 1, puiId: 1 }, { unique: true });

export const PuiReportSessionModel =
  (mongoose.models.PuiReportSession as mongoose.Model<PuiReportSession> | undefined) ??
  mongoose.model<PuiReportSession>('PuiReportSession', puiReportSessionSchema);
