import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const cwdEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');

const envPath = fs.existsSync(cwdEnvPath) ? cwdEnvPath : (fs.existsSync(serverEnvPath) ? serverEnvPath : null);
if (envPath) dotenv.config({ path: envPath, quiet: true });
else dotenv.config({ quiet: true });

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
    PUI_usuario: string;
    PUI_PASSWORD: string;
    PUI_BASE_URL: string;
    MONGODB_URI?: string;
    AUTH_usuario?: string;
    AUTH_PASSWORD_HASH?: string;
    AUTH_PASSWORD_PLAIN?: string;
    AUTH_PASSWORD_PEPPER?: string;
    AUDIT_HASH_PEPPER?: string;
    PUI_COMPANY_DEFAULT_ID?: string;
}

const base = {
    PORT : Number(process.env.PORT || 3000),
    JWT_SECRET: reqEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: String(process.env.JWT_EXPIRES_IN || '12h'),
    PUI_usuario: String(process.env.PUI_usuario || 'PUI'),
    PUI_PASSWORD: reqEnv('PUI_PASSWORD'),
    PUI_BASE_URL: String(process.env.PUI_BASE_URL || 'https://plataformadebusqueda.gob.mx/api/2'),
} as const;

const mongodbUri = optEnv('MONGODB_URI');
const authusuario = optEnv('AUTH_usuario');
const authPasswordHash = optEnv('AUTH_PASSWORD_HASH');
const authPasswordPlain = optEnv('AUTH_PASSWORD_PLAIN');
const authPasswordPepper = optEnv('AUTH_PASSWORD_PEPPER');
const auditHashPepper = optEnv('AUDIT_HASH_PEPPER');
const puiCompanyDefaultId = optEnv('PUI_COMPANY_DEFAULT_ID');

export const env: Env = {
    ...base,
    ...(mongodbUri ? { MONGODB_URI: mongodbUri } : {}),
    ...(authusuario ? { AUTH_usuario: authusuario } : {}),
    ...(authPasswordHash ? { AUTH_PASSWORD_HASH: authPasswordHash } : {}),
    ...(authPasswordPlain ? { AUTH_PASSWORD_PLAIN: authPasswordPlain } : {}),
    ...(authPasswordPepper ? { AUTH_PASSWORD_PEPPER: authPasswordPepper } : {}),
    ...(auditHashPepper ? { AUDIT_HASH_PEPPER: auditHashPepper } : {}),
    ...(puiCompanyDefaultId ? { PUI_COMPANY_DEFAULT_ID: puiCompanyDefaultId } : {})
};
