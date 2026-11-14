import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export async function hashPassword(pw: string) { return bcrypt.hash(pw, 10); }
export async function comparePassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }
export function signToken(p: { userId: number; email: string }) { return jwt.sign(p, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" }); }
export function verifyToken(t: string) { return jwt.verify(t, process.env.JWT_SECRET || "dev-secret") as { userId: number; email: string }; }
