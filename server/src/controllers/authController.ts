import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { applyPepper, getPasswordHash } from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  const { usuario, password } = req.body || {};
  if (typeof usuario !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "usuario and password are required" });
  }
  const uname = usuario.trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(uname)) {
    return res.status(400).json({ message: "invalid credentials" });
  }
  if (password.length < 1 || password.length > 256) {
    return res.status(400).json({ message: "invalid credentials" });
  }
  if (!env.AUTH_usuario || uname !== env.AUTH_usuario) {
    return res.status(401).json({ message: "invalid credentials" });
  }
  let ok = false;
  try {
    ok = await bcrypt.compare(applyPepper(password), getPasswordHash());
  } catch {
    ok = false;
  }
  if (!ok) return res.status(401).json({ message: "invalid credentials" });
  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  const token = jwt.sign({ sub: usuario }, env.JWT_SECRET, signOptions);
  return res.status(200).json({ token });
}
