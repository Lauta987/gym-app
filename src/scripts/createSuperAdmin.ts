import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "../models/user.model";

dotenv.config();

async function createSuperAdmin(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!mongoUri) {
      throw new Error("MONGO_URI no está configurado");
    }

    if (!email) {
      throw new Error("SUPERADMIN_EMAIL no está configurado");
    }

    if (!password || password.length < 8) {
      throw new Error(
        "SUPERADMIN_PASSWORD debe tener al menos 8 caracteres"
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado correctamente");

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (existingUser.role === "superadmin") {
        console.log("El Super Admin ya existe");
        return;
      }

      throw new Error(
        "Ya existe un usuario con ese email y tiene otro rol"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = await User.create({
      name: "Lautaro",
      lastName: "Espil Crespo",
      email: normalizedEmail,
      password: hashedPassword,
      role: "superadmin",
      active: true,
    });

    console.log("Super Admin creado correctamente");
    console.log(`Email: ${superAdmin.email}`);
    console.log(`ID: ${superAdmin._id.toString()}`);
  } catch (error) {
    console.error("Error al crear Super Admin:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Conexión cerrada");
  }
}

createSuperAdmin(); 