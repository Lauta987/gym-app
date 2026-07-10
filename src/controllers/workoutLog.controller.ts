import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkoutLog } from "../models/workoutLog.model";
import { Routine } from "../models/routine.model";
import { Exercise } from "../models/exercise.model";
import { User } from "../models/user.model";

interface CreateWorkoutLogBody {
  routineId: string;
  exerciseId: string;
  dayName: string;
  dayOrder: number;
  setsPlanned: number;
  repsPlanned: string;
  restPlanned: string;
  weight?: number;
  repsDone?: string;
  notes?: string;
}

export const createWorkoutLog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    const {
      routineId,
      exerciseId,
      dayName,
      dayOrder,
      setsPlanned,
      repsPlanned,
      restPlanned,
      weight,
      repsDone,
      notes,
    } = req.body as CreateWorkoutLogBody;

    if (user.role !== "student") {
      res.status(403).json({
        message: "Solo los alumnos pueden registrar progreso",
      });
      return;
    }

    if (
      !routineId ||
      !exerciseId ||
      !dayName ||
      !dayOrder ||
      !setsPlanned ||
      !repsPlanned ||
      !restPlanned
    ) {
      res.status(400).json({
        message: "Faltan datos obligatorios para registrar el progreso",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      res.status(400).json({
        message: "El routineId no es válido",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      res.status(400).json({
        message: "El exerciseId no es válido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: routineId,
      active: true,
    });

    if (!routine) {
      res.status(404).json({
        message: "Rutina no encontrada",
      });
      return;
    }

    const exercise = await Exercise.findOne({
      _id: exerciseId,
      active: true,
    });

    if (!exercise) {
      res.status(404).json({
        message: "Ejercicio no encontrado",
      });
      return;
    }

    const workoutLog = await WorkoutLog.create({
      studentId: user._id,
      routineId,
      exerciseId,
      dayName,
      dayOrder,
      setsPlanned,
      repsPlanned,
      restPlanned,
      weight,
      repsDone,
      notes,
      completedAt: new Date(),
    });

    const populatedLog = await WorkoutLog.findById(workoutLog._id)
      .populate("exerciseId", "name description muscles difficulty")
      .populate("routineId", "name objective level");

    res.status(201).json({
      message: "Progreso registrado correctamente",
      workoutLog: populatedLog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar progreso",
      error,
    });
  }
};

export const getMyWorkoutLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (user.role !== "student") {
      res.status(403).json({
        message: "Solo los alumnos pueden ver su progreso",
      });
      return;
    }

    const workoutLogs = await WorkoutLog.find({
      studentId: user._id,
    })
      .populate("exerciseId", "name description muscles difficulty")
      .populate("routineId", "name objective level")
      .sort({ completedAt: -1 });

    res.json({
      message: "Progreso obtenido correctamente",
      workoutLogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener progreso",
      error,
    });
  }
};

export const getStudentWorkoutLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({
        message: "El studentId no es válido",
      });
      return;
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    }).select("-password");

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    const workoutLogs = await WorkoutLog.find({
      studentId,
    })
      .populate("exerciseId", "name description muscles difficulty")
      .populate("routineId", "name objective level")
      .sort({ completedAt: -1 });

    res.json({
      message: "Progreso del alumno obtenido correctamente",
      student,
      workoutLogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener progreso del alumno",
      error,
    });
  }
}; 