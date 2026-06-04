import { Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { verifyPassword } from "../services/auth.service.js";
import { ApiUserModel } from "../models/apiUser.js";
import { resolveCompanyIdFromHostname } from "./puiHelpers.js";

export async function login(req: Request, res: Response) {
  const { usuario, password } = req.body || {};
  if (typeof usuario !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "usuario and password are required" });
  }
  if (!env.MONGODB_URI) {
    return res.status(500).json({ message: "auth not configured" });
  }
  const uname = usuario.trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(uname)) {
    return res.status(400).json({ message: "invalid credentials" });
  }
  if (password.length < 1 || password.length > 256) {
    return res.status(400).json({ message: "invalid credentials" });
  }

  let ok = false;
  try {
    const user = await ApiUserModel.findOne({ usuario: uname }).exec();
    if (!user) return res.status(401).json({ message: "invalid credentials" });
    ok = await verifyPassword(password, user.passwordHash);
  } catch {
    ok = false;
  }
  if (!ok) return res.status(401).json({ message: "invalid credentials" });
  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any, audience: 'api' };
  const token = jwt.sign({ sub: usuario }, env.JWT_SECRET, signOptions);
  return res.status(200).json({
    token,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
    audience: 'api',
    hostname: req.hostname,
    companyId: resolveCompanyIdFromHostname(req.hostname)
  });
}
