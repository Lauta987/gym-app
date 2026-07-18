import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

interface JwtPayload {
  id: string;
  role: string;
  gymId?: string | null;
  iat?: number;
  exp?: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "No autorizado. Token no enviado",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "No autorizado. Token inválido",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET no está configurado");

      res.status(500).json({
        message: "Error de configuración del servidor",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.id) {
      res.status(401).json({
        message: "Token inválido",
      });
      return;
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({
        message: "No autorizado. Usuario no encontrado",
      });
      return;
    }

    /*
     * Se compara expresamente con false para mantener compatibilidad
     * con usuarios antiguos que todavía no tengan el campo active.
     */
    if (user.active === false) {
      res.status(403).json({
        message: "Usuario desactivado",
      });
      return;
    }

    (req as any).user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "La sesión expiró. Iniciá sesión nuevamente",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Token inválido",
      });
      return;
    }

    console.error("Error al validar token:", error);

    res.status(401).json({
      message: "No autorizado",
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.trim().toLowerCase(),
  );

  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        message: "No autorizado",
      });
      return;
    }

    const userRole =
      typeof user.role === "string"
        ? user.role.trim().toLowerCase()
        : "";

    if (!normalizedAllowedRoles.includes(userRole)) {
      res.status(403).json({
        message: "No tenés permisos para realizar esta acción",
      });
      return;
    }

    next();
  };
}; 