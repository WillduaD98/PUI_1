import bcrypt from 'bcrypt';
import {env} from '../config/env.js';

let passwordHashCache: string | null = null;

export function applyPepper(value: string) {
  const pepper = env.AUTH_PASSWORD_PEPPER;
  return pepper ? `${value}${pepper}` : value;
}

export function getPasswordHash(): string {
    if (passwordHashCache) return passwordHashCache;
    const hash = env.AUTH_PASSWORD_HASH;
    const plain = env.AUTH_PASSWORD_PLAIN;

    if (hash) {
        passwordHashCache = hash;
        return passwordHashCache
    }
      if (plain) {
    passwordHashCache = bcrypt.hashSync(applyPepper(plain), 12);
    return passwordHashCache;
  }
    throw new Error('password hash not found');
}

export async function hashPasswordForStorage(plainPassword: string): Promise<string> {
  return bcrypt.hash(applyPepper(plainPassword), 12);
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(applyPepper(plainPassword), passwordHash);
}
