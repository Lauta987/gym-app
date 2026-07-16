import dotenv from "dotenv";
import mongoose from "mongoose";

import { Gym } from "../models/gym.model";
import { User } from "../models/user.model";
import { Exercise } from "../models/exercise.model";
import { Routine } from "../models/routine.model";
import { WorkoutLog } from "../models/workoutLog.model";

dotenv.config();

const DEFAULT_GYM = {
  name: "GymStart Demo",
  slug: "gymstart-demo",
  primaryColor: "#ff5a1f",
  secondaryColor: "#111111",
  active: true,
};

async function migrateDefaultGym() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI no está configurado en el archivo .env");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado correctamente");

    /*
     * Si el gimnasio ya existe, lo reutiliza.
     * Esto permite ejecutar el script nuevamente sin duplicarlo.
     */
    let gym = await Gym.findOne({
      slug: DEFAULT_GYM.slug,
    });

    if (!gym) {
      gym = await Gym.create(DEFAULT_GYM);

      console.log(`Gimnasio creado: ${gym.name}`);
    } else {
      console.log(`El gimnasio ya existe: ${gym.name}`);
    }

    /*
     * Solo actualiza documentos que todavía no tengan gymId.
     * No modifica datos que ya pertenezcan a otro gimnasio.
     */
    const usersResult = await User.updateMany(
      {
        $or: [
          { gymId: { $exists: false } },
          { gymId: null },
        ],
      },
      {
        $set: {
          gymId: gym._id,
        },
      }
    );

    const exercisesResult = await Exercise.updateMany(
      {
        $or: [
          { gymId: { $exists: false } },
          { gymId: null },
        ],
      },
      {
        $set: {
          gymId: gym._id,
        },
      }
    );

    const routinesResult = await Routine.updateMany(
      {
        $or: [
          { gymId: { $exists: false } },
          { gymId: null },
        ],
      },
      {
        $set: {
          gymId: gym._id,
        },
      }
    );

    const workoutLogsResult = await WorkoutLog.updateMany(
      {
        $or: [
          { gymId: { $exists: false } },
          { gymId: null },
        ],
      },
      {
        $set: {
          gymId: gym._id,
        },
      }
    );

    console.log("");
    console.log("Migración completada:");
    console.log(`Usuarios actualizados: ${usersResult.modifiedCount}`);
    console.log(`Ejercicios actualizados: ${exercisesResult.modifiedCount}`);
    console.log(`Rutinas actualizadas: ${routinesResult.modifiedCount}`);
    console.log(
      `Registros de progreso actualizados: ${workoutLogsResult.modifiedCount}`
    );

    console.log("");
    console.log(`Gym ID: ${gym._id.toString()}`);
  } catch (error) {
    console.error("Error durante la migración:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Conexión cerrada");
  }
}

migrateDefaultGym(); 