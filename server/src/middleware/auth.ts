import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";
export interface AuthedRequest extends Request { user?: { userId: number; email: string } }
export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)/);
    if (!m) return res.status(401).json({ error: { message: "Missing token", code: "UNAUTHORIZED" } });
    try { req.user = verifyToken(m[1]); next(); } catch { return res.status(401).json({ error: { message: "Invalid token", code: "UNAUTHORIZED" } }); }
}
