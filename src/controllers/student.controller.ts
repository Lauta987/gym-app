import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model";

export const createStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { name, lastName, email, password } = req.body;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario administrador no tiene un gimnasio asignado",
      });
      return;
    }

    if (!name || !lastName || !email || !password) {
      res.status(400).json({
        message: "Nombre, apellido, email y contraseña son obligatorios",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const studentExists = await User.findOne({
      email: normalizedEmail,
    });

    if (studentExists) {
      res.status(400).json({
        message: "Ya existe un usuario con ese email",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await User.create({
      gymId: authenticatedUser.gymId,
      name: name.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      active: true,
    });

    res.status(201).json({
      message: "Alumno creado correctamente",
      student: {
        _id: student._id,
        gymId: student.gymId,
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        active: student.active,
        assignedRoutine: student.assignedRoutine,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error al crear alumno:", error);

    res.status(500).json({
      message: "Error interno al crear alumno",
    });
  }
};

export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    const students = await User.find({
      gymId: authenticatedUser.gymId,
      role: "student",
    })
      .select("-password")
      .populate({
        path: "assignedRoutine",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select: "name level objective",
      })
      .sort({ createdAt: -1 });

    res.json({
      message: "Alumnos obtenidos correctamente",
      students,
    });
  } catch (error) {
    console.error("Error al obtener alumnos:", error);

    res.status(500).json({
      message: "Error interno al obtener alumnos",
    });
  }
};

export const getStudentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de alumno inválido",
      });
      return;
    }

    const student = await User.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      role: "student",
    })
      .select("-password")
      .populate({
        path: "assignedRoutine",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select: "name level objective",
      });

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
    console.error("Error al obtener alumno:", error);

    res.status(500).json({
      message: "Error interno al obtener alumno",
    });
  }
};

export const updateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;
    const { name, lastName, email, password, active } = req.body;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de alumno inválido",
      });
      return;
    }

    const student = await User.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      role: "student",
    });

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();

      if (normalizedEmail !== student.email) {
        const emailExists = await User.findOne({
          email: normalizedEmail,
        });

        if (emailExists) {
          res.status(400).json({
            message: "Ya existe un usuario con ese email",
          });
          return;
        }

        student.email = normalizedEmail;
      }
    }

    if (name) {
      student.name = name.trim();
    }

    if (lastName) {
      student.lastName = lastName.trim();
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      student.password = hashedPassword;
    }

    if (typeof active === "boolean") {
      student.active = active;
    }

    await student.save();

    const updatedStudent = await User.findOne({
      _id: student._id,
      gymId: authenticatedUser.gymId,
      role: "student",
    })
      .select("-password")
      .populate({
        path: "assignedRoutine",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select: "name level objective",
      });

    res.json({
      message: "Alumno actualizado correctamente",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error al actualizar alumno:", error);

    res.status(500).json({
      message: "Error interno al actualizar alumno",
    });
  }
};

export const deactivateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de alumno inválido",
      });
      return;
    }

    const student = await User.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
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
    console.error("Error al desactivar alumno:", error);

    res.status(500).json({
      message: "Error interno al desactivar alumno",
    });
  }
}; 