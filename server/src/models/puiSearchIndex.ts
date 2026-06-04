import mongoose, { Schema } from 'mongoose';

export type PuiSearchStatus = 'active' | 'inactive';
export type PuiSearchSource = 'nebur_sync' | 'excel_upload';

export type PuiSearchIndex = {
  companyId: string;
  externalClientId?: string;
  curp: string;
  nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  estatus: PuiSearchStatus;
  source: PuiSearchSource;
  uploadId?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const puiSearchIndexSchema = new Schema<PuiSearchIndex>(
  {
    companyId: { type: String, required: true, index: true },
    externalClientId: { type: String, required: false },
    curp: { type: String, required: true, index: true },
    nombre: { type: String, required: false },
    primer_apellido: { type: String, required: false },
    segundo_apellido: { type: String, required: false },
    fecha_nacimiento: { type: String, required: false },
    telefono: { type: String, required: false },
    correo: { type: String, required: false },
    direccion: { type: String, required: false },
    estatus: { type: String, required: true },
    source: { type: String, required: true },
    uploadId: { type: String, required: false },
    lastSyncedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

puiSearchIndexSchema.index({ companyId: 1, curp: 1 }, { unique: true });

export const PuiSearchIndexModel =
  (mongoose.models.PuiSearchIndex as mongoose.Model<PuiSearchIndex> | undefined) ??
  mongoose.model<PuiSearchIndex>('PuiSearchIndex', puiSearchIndexSchema);
