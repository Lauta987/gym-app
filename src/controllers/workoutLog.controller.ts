import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkoutLog } from "../models/workoutLog.model";
import { Routine } from "../models/routine.model";
import { User } from "../models/user.model";

interface CreateWorkoutLogBody {
  routineId: string;
  exerciseId: string;
  dayName: string;
  weight?: number;
  repsDone?: string;
  notes?: string;
}

export const createWorkoutLog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser?._id) {
      res.status(401).json({
        message: "Usuario no autenticado",
      });
      return;
    }

    if (authenticatedUser.role !== "student") {
      res.status(403).json({
        message: "Solo los alumnos pueden registrar progreso",
      });
      return;
    }

    if (!authenticatedUser.gymId) {
      res.status(403).json({
        message: "El alumno no tiene un gimnasio asignado",
      });
      return;
    }

    const {
      routineId,
      exerciseId,
      dayName,
      weight,
      repsDone,
      notes,
    } = req.body as CreateWorkoutLogBody;

    if (!routineId || !exerciseId || !dayName?.trim()) {
      res.status(400).json({
        message: "La rutina, el ejercicio y el día son obligatorios",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      res.status(400).json({
        message: "El ID de la rutina no es válido",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      res.status(400).json({
        message: "El ID del ejercicio no es válido",
      });
      return;
    }

    if (
      weight !== undefined &&
      (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0)
    ) {
      res.status(400).json({
        message: "El peso debe ser un número igual o mayor que cero",
      });
      return;
    }

    if (
      repsDone !== undefined &&
      (typeof repsDone !== "string" || repsDone.trim().length > 50)
    ) {
      res.status(400).json({
        message: "Las repeticiones realizadas no pueden superar 50 caracteres",
      });
      return;
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.trim().length > 500)
    ) {
      res.status(400).json({
        message: "Las notas no pueden superar los 500 caracteres",
      });
      return;
    }

    const student = await User.findOne({
      _id: authenticatedUser._id,
      gymId: authenticatedUser.gymId,
      role: "student",
      active: true,
    }).select("gymId assignedRoutine");

    if (!student) {
      res.status(403).json({
        message: "La cuenta del alumno no existe o está inactiva",
      });
      return;
    }

    if (!student.assignedRoutine) {
      res.status(400).json({
        message: "Todavía no tenés una rutina asignada",
      });
      return;
    }

    if (student.assignedRoutine.toString() !== routineId) {
      res.status(403).json({
        message:
          "No podés registrar progreso en una rutina que no tenés asignada",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: routineId,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!routine) {
      res.status(404).json({
        message: "La rutina asignada no existe o está inactiva",
      });
      return;
    }

    const routineDay = routine.days.find(
      (day) =>
        day.dayName.trim().toLowerCase() ===
        dayName.trim().toLowerCase()
    );

    if (!routineDay) {
      res.status(400).json({
        message: "El día seleccionado no pertenece a la rutina",
      });
      return;
    }

    const routineExercise = routineDay.exercises.find(
      (item) => item.exerciseId.toString() === exerciseId
    );

    if (!routineExercise) {
      res.status(400).json({
        message: "El ejercicio no pertenece al día seleccionado",
      });
      return;
    }

    const workoutLog = await WorkoutLog.create({
      gymId: authenticatedUser.gymId,
      studentId: authenticatedUser._id,
      routineId: routine._id,
      exerciseId: routineExercise.exerciseId,
      dayName: routineDay.dayName,
      dayOrder: routineDay.order,
      setsPlanned: routineExercise.sets,
      repsPlanned: routineExercise.reps,
      restPlanned: routineExercise.rest,
      weight,
      repsDone: repsDone?.trim(),
      notes: notes?.trim(),
      completedAt: new Date(),
    });

    const populatedLog = await WorkoutLog.findOne({
      _id: workoutLog._id,
      gymId: authenticatedUser.gymId,
      studentId: authenticatedUser._id,
    })
      .populate({
        path: "exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select:
          "name description imageUrl videoUrl muscles difficulty",
      })
      .populate({
        path: "routineId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name objective level",
      });

    res.status(201).json({
      message: "Progreso registrado correctamente",
      workoutLog: populatedLog,
    });
  } catch (error) {
    console.error("Error al registrar progreso:", error);

    res.status(500).json({
      message: "Error interno al registrar progreso",
    });
  }
};

export const getMyWorkoutLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser?._id) {
      res.status(401).json({
        message: "Usuario no autenticado",
      });
      return;
    }

    if (authenticatedUser.role !== "student") {
      res.status(403).json({
        message: "Solo los alumnos pueden ver su progreso",
      });
      return;
    }

    if (!authenticatedUser.gymId) {
      res.status(403).json({
        message: "El alumno no tiene un gimnasio asignado",
      });
      return;
    }

    const student = await User.findOne({
      _id: authenticatedUser._id,
      gymId: authenticatedUser.gymId,
      role: "student",
      active: true,
    }).select("_id");

    if (!student) {
      res.status(403).json({
        message: "La cuenta del alumno no existe o está inactiva",
      });
      return;
    }

    const workoutLogs = await WorkoutLog.find({
      gymId: authenticatedUser.gymId,
      studentId: authenticatedUser._id,
    })
      .populate({
        path: "exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select:
          "name description imageUrl videoUrl muscles difficulty",
      })
      .populate({
        path: "routineId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name objective level",
      })
      .sort({ completedAt: -1 });

    res.json({
      message: "Progreso obtenido correctamente",
      workoutLogs,
    });
  } catch (error) {
    console.error("Error al obtener progreso:", error);

    res.status(500).json({
      message: "Error interno al obtener progreso",
    });
  }
};

export const getStudentWorkoutLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { studentId } = req.params;

    if (!authenticatedUser?._id) {
      res.status(401).json({
        message: "Usuario no autenticado",
      });
      return;
    }

    if (
      authenticatedUser.role !== "admin" &&
      authenticatedUser.role !== "trainer"
    ) {
      res.status(403).json({
        message: "No tenés permisos para consultar este progreso",
      });
      return;
    }

    if (!authenticatedUser.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({
        message: "El ID del alumno no es válido",
      });
      return;
    }

    const student = await User.findOne({
      _id: studentId,
      gymId: authenticatedUser.gymId,
      role: "student",
    }).select("-password");

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    const workoutLogs = await WorkoutLog.find({
      gymId: authenticatedUser.gymId,
      studentId,
    })
      .populate({
        path: "exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select:
          "name description imageUrl videoUrl muscles difficulty",
      })
      .populate({
        path: "routineId",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name objective level",
      })
      .sort({ completedAt: -1 });

    res.json({
      message: "Progreso del alumno obtenido correctamente",
      student,
      workoutLogs,
    });
  } catch (error) {
    console.error("Error al obtener progreso del alumno:", error);

    res.status(500).json({
      message: "Error interno al obtener progreso del alumno",
    });
  }
}; 