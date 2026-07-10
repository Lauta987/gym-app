import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

export const createStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, lastName, email, password } = req.body;

    if (!name || !lastName || !email || !password) {
      res.status(400).json({
        message: "Nombre, apellido, email y contraseña son obligatorios",
      });
      return;
    }

    const studentExists = await User.findOne({ email });

    if (studentExists) {
      res.status(400).json({
        message: "Ya existe un usuario con ese email",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      name,
      lastName,
      email,
      password: hashedPassword,
      role: "student",
      active: true,
    });

    res.status(201).json({
      message: "Alumno creado correctamente",
      student: {
        id: student._id,
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        active: student.active,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear alumno",
      error,
    });
  }
};

export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      message: "Alumnos obtenidos correctamente",
      students,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener alumnos",
      error,
    });
  }
};

export const getStudentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      _id: id,
      role: "student",
    }).select("-password");

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    res.json({
      message: "Alumno obtenido correctamente",
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener alumno",
      error,
    });
  }
};

export const updateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, lastName, email, active } = req.body;

    const student = await User.findOne({
      _id: id,
      role: "student",
    });

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });

      if (emailExists) {
        res.status(400).json({
          message: "Ya existe un usuario con ese email",
        });
        return;
      }
    }

    student.name = name || student.name;
    student.lastName = lastName || student.lastName;
    student.email = email || student.email;

    if (typeof active === "boolean") {
      student.active = active;
    }

    await student.save();

    res.json({
      message: "Alumno actualizado correctamente",
      student: {
        id: student._id,
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        active: student.active,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar alumno",
      error,
    });
  }
};

export const deactivateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      _id: id,
      role: "student",
    });

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    student.active = false;
    await student.save();

    res.json({
      message: "Alumno desactivado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al desactivar alumno",
      error,
    });
  }
}; 