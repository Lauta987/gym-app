import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { Gym } from "../models/gym.model";
import { User } from "../models/user.model";
import { Exercise } from "../models/exercise.model";
import { Routine } from "../models/routine.model";
import { WorkoutLog } from "../models/workoutLog.model";

interface CreateGymBody {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: "basic" | "personalized" | "premium";

  adminName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

interface UpdateGymBody {
  name?: string;
  slug?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: "basic" | "personalized" | "premium";
  active?: boolean;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export const createGym = async (
  req: Request,
  res: Response
): Promise<void> => {
  let createdGymId: mongoose.Types.ObjectId | null = null;

  try {
    const authenticatedUser = (req as any).user;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede crear gimnasios",
      });
      return;
    }

    const {
      name,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      email,
      phone,
      address,
      plan,
      adminName,
      adminLastName,
      adminEmail,
      adminPassword,
    } = req.body as CreateGymBody;

    if (
      !name ||
      !slug ||
      !adminName ||
      !adminLastName ||
      !adminEmail ||
      !adminPassword
    ) {
      res.status(400).json({
        message:
          "Nombre, slug y datos del administrador son obligatorios",
      });
      return;
    }

    if (adminPassword.length < 8) {
      res.status(400).json({
        message:
          "La contraseña del administrador debe tener al menos 8 caracteres",
      });
      return;
    }

    if (primaryColor && !isValidHexColor(primaryColor)) {
      res.status(400).json({
        message: "El color principal debe tener formato hexadecimal",
      });
      return;
    }

    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      res.status(400).json({
        message: "El color secundario debe tener formato hexadecimal",
      });
      return;
    }

    const normalizedSlug = normalizeSlug(slug);
    const normalizedAdminEmail = adminEmail.trim().toLowerCase();

    if (!normalizedSlug) {
      res.status(400).json({
        message: "El slug del gimnasio no es válido",
      });
      return;
    }

    const [gymExists, adminExists] = await Promise.all([
      Gym.findOne({ slug: normalizedSlug }),
      User.findOne({ email: normalizedAdminEmail }),
    ]);

    if (gymExists) {
      res.status(400).json({
        message: "Ya existe un gimnasio con ese slug",
      });
      return;
    }

    if (adminExists) {
      res.status(400).json({
        message: "Ya existe un usuario con el email del administrador",
      });
      return;
    }

    const gym = await Gym.create({
      name: name.trim(),
      slug: normalizedSlug,
      logoUrl: logoUrl?.trim(),
      primaryColor: primaryColor || "#ff5a1f",
      secondaryColor: secondaryColor || "#111111",
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      address: address?.trim(),
      plan: plan || "basic",
      active: true,
    });

    createdGymId = gym._id as mongoose.Types.ObjectId;

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await User.create({
      gymId: gym._id,
      name: adminName.trim(),
      lastName: adminLastName.trim(),
      email: normalizedAdminEmail,
      password: hashedPassword,
      role: "admin",
      active: true,
    });

    res.status(201).json({
      message: "Gimnasio y administrador creados correctamente",
      gym,
      admin: {
        id: admin._id,
        gymId: admin.gymId,
        name: admin.name,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        active: admin.active,
      },
    });
  } catch (error) {
    /*
     * Si el gimnasio se creó pero falló la creación del administrador,
     * eliminamos el gimnasio incompleto.
     */
    if (createdGymId) {
      await Gym.findByIdAndDelete(createdGymId).catch(() => undefined);
    }

    console.error("Error al crear gimnasio:", error);

    res.status(500).json({
      message: "Error interno al crear gimnasio",
    });
  }
};

export const getGyms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede consultar gimnasios",
      });
      return;
    }

    const gyms = await Gym.find().sort({ createdAt: -1 }).lean();

    const gymsWithStats = await Promise.all(
      gyms.map(async (gym) => {
        const [
          admins,
          trainers,
          students,
          exercises,
          routines,
          workoutLogs,
        ] = await Promise.all([
          User.countDocuments({
            gymId: gym._id,
            role: "admin",
          }),
          User.countDocuments({
            gymId: gym._id,
            role: "trainer",
          }),
          User.countDocuments({
            gymId: gym._id,
            role: "student",
          }),
          Exercise.countDocuments({
            gymId: gym._id,
            active: true,
          }),
          Routine.countDocuments({
            gymId: gym._id,
            active: true,
          }),
          WorkoutLog.countDocuments({
            gymId: gym._id,
          }),
        ]);

        return {
          ...gym,
          stats: {
            admins,
            trainers,
            students,
            exercises,
            routines,
            workoutLogs,
          },
        };
      })
    );

    res.json({
      message: "Gimnasios obtenidos correctamente",
      gyms: gymsWithStats,
    });
  } catch (error) {
    console.error("Error al obtener gimnasios:", error);

    res.status(500).json({
      message: "Error interno al obtener gimnasios",
    });
  }
};

export const getGymById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede consultar gimnasios",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    const [admins, trainers, students, exercises, routines, workoutLogs] =
      await Promise.all([
        User.countDocuments({
          gymId: gym._id,
          role: "admin",
        }),
        User.countDocuments({
          gymId: gym._id,
          role: "trainer",
        }),
        User.countDocuments({
          gymId: gym._id,
          role: "student",
        }),
        Exercise.countDocuments({
          gymId: gym._id,
          active: true,
        }),
        Routine.countDocuments({
          gymId: gym._id,
          active: true,
        }),
        WorkoutLog.countDocuments({
          gymId: gym._id,
        }),
      ]);

    res.json({
      message: "Gimnasio obtenido correctamente",
      gym,
      stats: {
        admins,
        trainers,
        students,
        exercises,
        routines,
        workoutLogs,
      },
    });
  } catch (error) {
    console.error("Error al obtener gimnasio:", error);

    res.status(500).json({
      message: "Error interno al obtener gimnasio",
    });
  }
};

export const updateGym = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;
    const {
      name,
      slug,
      logoUrl,
      primaryColor,
      secondaryColor,
      email,
      phone,
      address,
      plan,
      active,
    } = req.body as UpdateGymBody;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede editar gimnasios",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    if (slug) {
      const normalizedSlug = normalizeSlug(slug);

      const slugExists = await Gym.findOne({
        slug: normalizedSlug,
        _id: { $ne: gym._id },
      });

      if (slugExists) {
        res.status(400).json({
          message: "Ya existe otro gimnasio con ese slug",
        });
        return;
      }

      gym.slug = normalizedSlug;
    }

    if (primaryColor && !isValidHexColor(primaryColor)) {
      res.status(400).json({
        message: "El color principal debe tener formato hexadecimal",
      });
      return;
    }

    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      res.status(400).json({
        message: "El color secundario debe tener formato hexadecimal",
      });
      return;
    }

    if (name !== undefined) gym.name = name.trim();
    if (logoUrl !== undefined) gym.logoUrl = logoUrl.trim() || undefined;
    if (primaryColor !== undefined) gym.primaryColor = primaryColor;
    if (secondaryColor !== undefined) {
      gym.secondaryColor = secondaryColor;
    }
    if (email !== undefined) {
      gym.email = email.trim().toLowerCase() || undefined;
    }
    if (phone !== undefined) gym.phone = phone.trim() || undefined;
    if (address !== undefined) {
      gym.address = address.trim() || undefined;
    }
    if (plan !== undefined) gym.plan = plan;
    if (typeof active === "boolean") gym.active = active;

    await gym.save();

    /*
     * Si se suspende un gimnasio, también se desactivan sus usuarios.
     * Al reactivarlo, no reactivamos usuarios individuales automáticamente.
     */
    if (active === false) {
      await User.updateMany(
        {
          gymId: gym._id,
        },
        {
          $set: {
            active: false,
          },
        }
      );
    }

    res.json({
      message: "Gimnasio actualizado correctamente",
      gym,
    });
  } catch (error) {
    console.error("Error al actualizar gimnasio:", error);

    res.status(500).json({
      message: "Error interno al actualizar gimnasio",
    });
  }
};

export const deactivateGym = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede suspender gimnasios",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    gym.active = false;
    await gym.save();

    await User.updateMany(
      {
        gymId: gym._id,
      },
      {
        $set: {
          active: false,
        },
      }
    );

    res.json({
      message: "Gimnasio suspendido correctamente",
    });
  } catch (error) {
    console.error("Error al suspender gimnasio:", error);

    res.status(500).json({
      message: "Error interno al suspender gimnasio",
    });
  }
};
 interface CreateGymAdminBody {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

interface UpdateGymAdminStatusBody {
  active: boolean;
}

interface ResetGymAdminPasswordBody {
  password: string;
}

export const getGymAdmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede consultar administradores",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findById(id).select(
      "_id name slug active"
    );

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    const admins = await User.find({
      gymId: gym._id,
      role: "admin",
    })
      .select(
        "_id gymId name lastName email role active createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    res.json({
      message: "Administradores obtenidos correctamente",
      gym,
      admins,
    });
  } catch (error) {
    console.error("Error al obtener administradores:", error);

    res.status(500).json({
      message: "Error interno al obtener administradores",
    });
  }
};

export const createGymAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    const {
      name,
      lastName,
      email,
      password,
    } = req.body as CreateGymAdminBody;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message: "Solo el Super Admin puede crear administradores",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de gimnasio inválido",
      });
      return;
    }

    if (!name?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      res.status(400).json({
        message:
          "Nombre, apellido, email y contraseña son obligatorios",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    if (password.length > 72) {
      res.status(400).json({
        message: "La contraseña no puede superar los 72 caracteres",
      });
      return;
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    if (!gym.active) {
      res.status(400).json({
        message:
          "No se pueden crear administradores para un gimnasio suspendido",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(400).json({
        message: "Ya existe un usuario registrado con ese email",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      gymId: gym._id,
      name: name.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      active: true,
    });

    res.status(201).json({
      message: "Administrador creado correctamente",
      admin: {
        id: admin._id,
        gymId: admin.gymId,
        name: admin.name,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        active: admin.active,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Error al crear administrador:", error);

    res.status(500).json({
      message: "Error interno al crear administrador",
    });
  }
};

export const updateGymAdminStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id, adminId } = req.params;
    const { active } = req.body as UpdateGymAdminStatusBody;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message:
          "Solo el Super Admin puede modificar administradores",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(adminId)
    ) {
      res.status(400).json({
        message: "ID inválido",
      });
      return;
    }

    if (typeof active !== "boolean") {
      res.status(400).json({
        message: "El estado active debe ser verdadero o falso",
      });
      return;
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    if (active && !gym.active) {
      res.status(400).json({
        message:
          "No se puede activar un administrador de un gimnasio suspendido",
      });
      return;
    }

    const admin = await User.findOne({
      _id: adminId,
      gymId: gym._id,
      role: "admin",
    });

    if (!admin) {
      res.status(404).json({
        message: "Administrador no encontrado en este gimnasio",
      });
      return;
    }

    admin.active = active;
    await admin.save();

    res.json({
      message: active
        ? "Administrador activado correctamente"
        : "Administrador desactivado correctamente",
      admin: {
        id: admin._id,
        gymId: admin.gymId,
        name: admin.name,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        active: admin.active,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Error al actualizar estado del administrador:",
      error
    );

    res.status(500).json({
      message:
        "Error interno al actualizar el estado del administrador",
    });
  }
};

export const resetGymAdminPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id, adminId } = req.params;
    const { password } = req.body as ResetGymAdminPasswordBody;

    if (authenticatedUser?.role !== "superadmin") {
      res.status(403).json({
        message:
          "Solo el Super Admin puede cambiar contraseñas de administradores",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(adminId)
    ) {
      res.status(400).json({
        message: "ID inválido",
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    if (password.length > 72) {
      res.status(400).json({
        message: "La contraseña no puede superar los 72 caracteres",
      });
      return;
    }

    const admin = await User.findOne({
      _id: adminId,
      gymId: id,
      role: "admin",
    });

    if (!admin) {
      res.status(404).json({
        message: "Administrador no encontrado en este gimnasio",
      });
      return;
    }

    admin.password = await bcrypt.hash(password, 12);
    await admin.save();

    res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error(
      "Error al cambiar contraseña del administrador:",
      error
    );

    res.status(500).json({
      message:
        "Error interno al cambiar la contraseña del administrador",
    });
  }
}; 