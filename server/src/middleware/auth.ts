import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      teacherId?: string;
      organizationId?: string;
      adminId?: string;
      email?: string;
      userType?: "teacher" | "organization" | "admin";
      role?: "super_admin" | "admin";
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

  if (payload.adminId) {
    req.adminId = payload.adminId;
    req.userType = "admin";
    req.role = payload.role;
  } else if (payload.teacherId) {
    req.teacherId = payload.teacherId;
    req.userType = "teacher";
  } else if (payload.organizationId) {
    req.organizationId = payload.organizationId;
    req.userType = "organization";
  }

  req.email = payload.email;

  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (!payload.adminId || payload.userType !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.adminId = payload.adminId;
  req.userType = "admin";
  req.role = payload.role;
  req.email = payload.email;

  return next();
}

export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (!payload.organizationId || payload.userType !== "organization") {
    return res.status(403).json({ error: "Organization access required" });
  }

  req.organizationId = payload.organizationId;
  req.userType = "organization";
  req.email = payload.email;

  return next();
}



