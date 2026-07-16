import { Request, Response, NextFunction } from "express";
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
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No autorizado. Token no enviado",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No autorizado. Token inválido",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET no está configurado");

      return res.status(500).json({
        message: "Error de configuración del servidor",
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.id) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    /*
     * Consultamos nuevamente al usuario en MongoDB.
     * Así verificamos su estado actual, rol y gymId,
     * aunque el token haya sido generado anteriormente.
     */
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "No autorizado. Usuario no encontrado",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Usuario desactivado",
      });
    }

    (req as any).user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "La sesión expiró. Iniciá sesión nuevamente",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    console.error("Error al validar token:", error);

    return res.status(401).json({
      message: "No autorizado",
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: "No tenés permisos para realizar esta acción",
      });
    }

    next();
  };
}; 