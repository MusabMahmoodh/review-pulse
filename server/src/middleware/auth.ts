import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      restaurantId?: string;
      restaurantEmail?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.restaurantId = payload.restaurantId;
  req.restaurantEmail = payload.email;

  return next();
}



