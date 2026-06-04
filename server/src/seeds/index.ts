import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { ApiUserModel } from '../models/apiUser.js';
import { hashPasswordForStorage } from '../services/auth.service.js';

async function upsertApiUser(opts: { usuario: string; passwordHash: string }) {
  const existing = await ApiUserModel.findOne({ usuario: opts.usuario }).exec();
  if (!existing) {
    await ApiUserModel.create({ usuario: opts.usuario, passwordHash: opts.passwordHash });
    return;
  }
  existing.passwordHash = opts.passwordHash;
  await existing.save();
}

async function main() {
  if (!env.MONGODB_URI) throw new Error('Missing env var: MONGODB_URI');
  await connectDB();

  const usuario = env.AUTH_usuario;
  const plain = env.AUTH_PASSWORD_PLAIN;
  const hash = env.AUTH_PASSWORD_HASH;

  if (!usuario) throw new Error('Missing env var: AUTH_usuario');
  if (!plain && !hash) throw new Error('Missing env var: AUTH_PASSWORD_PLAIN or AUTH_PASSWORD_HASH');

  const passwordHash = plain ? await hashPasswordForStorage(plain) : String(hash);
  await upsertApiUser({ usuario, passwordHash });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
