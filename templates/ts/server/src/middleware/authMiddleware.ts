import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User from "../models/user.js";
import type { IUser } from "../models/user.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JwtPayloadWithId extends JwtPayload {
  id: string;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500);
      throw new Error("JWT secret is not defined");
    }

    const decoded = jwt.verify(
      token!,
      jwtSecret,
    ) as unknown as JwtPayloadWithId;

    if (!decoded.id) {
      res.status(401);
      throw new Error("Invalid token payload");
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    next(new Error("Not authorized, token failed"));
  }
};

export const admin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    next(new Error("Not authorized as an admin"));
  }
};
