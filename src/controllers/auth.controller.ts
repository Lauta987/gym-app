import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, lastName, email, password, role } = req.body;

    if (!name || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos obligatorios deben estar completos",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({
      email: normalizedEmail,
    });

    if (userExists) {
      return res.status(400).json({
        message: "Ya existe un usuario con ese email",
      });
    }

    const authenticatedUser = (req as any).user;

    /*
     * Si el registro lo realiza un administrador autenticado,
     * el nuevo usuario hereda el gimnasio del administrador.
     *
     * Mientras terminamos la migración, gymId puede quedar vacío
     * para los registros antiguos o iniciales.
     */
    const gymId = authenticatedUser?.gymId;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      gymId,
      name: name.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student",
      active: true,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user._id,
        gymId: user.gymId ?? null,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    return res.status(500).json({
      message: "Error interno al registrar usuario",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Credenciales incorrectas",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales incorrectas",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "El usuario se encuentra desactivado",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET no está configurado");

      return res.status(500).json({
        message: "Error de configuración del servidor",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        gymId: user.gymId?.toString() ?? null,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Login correcto",
      token,
      user: {
        id: user._id,
        gymId: user.gymId ?? null,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      message: "Error interno al iniciar sesión",
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    return res.json({
      message: "Perfil obtenido correctamente",
      user: {
        id: user._id,
        gymId: user.gymId ?? null,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
        assignedRoutine: user.assignedRoutine ?? null,
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    return res.status(500).json({
      message: "Error interno al obtener perfil",
    });
  }
}; 