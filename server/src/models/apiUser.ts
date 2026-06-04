import mongoose, { Schema } from 'mongoose';

export type ApiUser = {
  usuario: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const apiUserSchema = new Schema<ApiUser>(
  {
    usuario: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const ApiUserModel =
  (mongoose.models.ApiUser as mongoose.Model<ApiUser> | undefined) ??
  mongoose.model<ApiUser>('ApiUser', apiUserSchema);
