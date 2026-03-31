import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const cwdEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');

const envPath = fs.existsSync(cwdEnvPath) ? cwdEnvPath : (fs.existsSync(serverEnvPath) ? serverEnvPath : null);
if (envPath) dotenv.config({ path: envPath });
else dotenv.config();

function reqEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error (`Missin env var: ${name}`);
    return v;
}

function optEnv(name: string): string | undefined {
    const v = process.env[name];
    if (!v) return undefined;
    return v;
}

type Env = {
    PORT: number;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    PUI_USERNAME: string;
    PUI_PASSWORD: string;
    PUI_BASE_URL: string;
    MONGODB_URI?: string;
    AUTH_USERNAME?: string;
    AUTH_PASSWORD_HASH?: string;
    AUTH_PASSWORD_PLAIN?: string;
    AUTH_PASSWORD_PEPPER?: string;
}

const base = {
    PORT : Number(process.env.PORT || 3000),
    JWT_SECRET: reqEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: String(process.env.JWT_EXPIRES_IN || '12h'),
    PUI_USERNAME: String(process.env.PUI_USERNAME || 'PUI'),
    PUI_PASSWORD: reqEnv('PUI_PASSWORD'),
    PUI_BASE_URL: String(process.env.PUI_BASE_URL || 'https://plataformadebusqueda.gob.mx/api/2'),
} as const;

const mongodbUri = optEnv('MONGODB_URI');
const authUsername = optEnv('AUTH_USERNAME');
const authPasswordHash = optEnv('AUTH_PASSWORD_HASH');
const authPasswordPlain = optEnv('AUTH_PASSWORD_PLAIN');
const authPasswordPepper = optEnv('AUTH_PASSWORD_PEPPER');

export const env: Env = {
    ...base,
    ...(mongodbUri ? { MONGODB_URI: mongodbUri } : {}),
    ...(authUsername ? { AUTH_USERNAME: authUsername } : {}),
    ...(authPasswordHash ? { AUTH_PASSWORD_HASH: authPasswordHash } : {}),
    ...(authPasswordPlain ? { AUTH_PASSWORD_PLAIN: authPasswordPlain } : {}),
    ...(authPasswordPepper ? { AUTH_PASSWORD_PEPPER: authPasswordPepper } : {})
};
