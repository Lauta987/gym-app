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

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Ya existe un usuario con ese email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      lastName,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user._id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al registrar usuario",
      error,
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

    const user = await User.findOne({ email });

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
      return res.status(500).json({
        message: "No se encontró JWT_SECRET en el archivo .env",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
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
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al iniciar sesión",
      error,
    });
  }
}; 
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    return res.json({
      message: "Perfil obtenido correctamente",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener perfil",
      error,
    });
  }
}; 