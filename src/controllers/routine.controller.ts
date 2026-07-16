import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { Routine } from "../models/routine.model";
import { Exercise } from "../models/exercise.model";
import { User } from "../models/user.model";

interface RoutineExerciseInput {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  order?: number;
  notes?: string;
}

interface RoutineDayInput {
  dayName: string;
  order?: number;
  exercises: RoutineExerciseInput[];
}

interface CreateRoutineBody {
  name: string;
  description?: string;
  objective?: string;
  level?: "principiante" | "intermedio" | "avanzado";
  days: RoutineDayInput[];
}

function validateRoutineDays(
  days: RoutineDayInput[],
  res: Response
): boolean {
  if (!Array.isArray(days) || days.length === 0) {
    res.status(400).json({
      message: "La rutina debe tener al menos un día",
    });
    return false;
  }

  for (const day of days) {
    if (!day.dayName?.trim()) {
      res.status(400).json({
        message: "Cada día debe tener un nombre",
      });
      return false;
    }

    if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
      res.status(400).json({
        message: "Cada día debe tener al menos un ejercicio",
      });
      return false;
    }

    for (const item of day.exercises) {
      if (
        !item.exerciseId ||
        !item.sets ||
        !item.reps?.trim() ||
        !item.rest?.trim()
      ) {
        res.status(400).json({
          message:
            "Cada ejercicio debe tener exerciseId, sets, reps y descanso",
        });
        return false;
      }

      if (!mongoose.Types.ObjectId.isValid(item.exerciseId)) {
        res.status(400).json({
          message: "Uno de los IDs de ejercicio no es válido",
        });
        return false;
      }

      if (!Number.isInteger(item.sets) || item.sets <= 0) {
        res.status(400).json({
          message: "La cantidad de series debe ser mayor que cero",
        });
        return false;
      }
    }
  }

  return true;
}

export const createRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { name, description, objective, level, days } =
      req.body as CreateRoutineBody;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!name?.trim()) {
      res.status(400).json({
        message: "El nombre de la rutina es obligatorio",
      });
      return;
    }

    if (!validateRoutineDays(days, res)) {
      return;
    }

    const exerciseIds = days.flatMap((day) =>
      day.exercises.map((item) => item.exerciseId)
    );

    const uniqueExerciseIds = [...new Set(exerciseIds)];

    const existingExercises = await Exercise.find({
      _id: { $in: uniqueExerciseIds },
      gymId: authenticatedUser.gymId,
      active: true,
    }).select("_id");

    if (existingExercises.length !== uniqueExerciseIds.length) {
      res.status(400).json({
        message:
          "Uno o más ejercicios no existen, están inactivos o pertenecen a otro gimnasio",
      });
      return;
    }

    const routine = await Routine.create({
      gymId: authenticatedUser.gymId,
      name: name.trim(),
      description: description?.trim(),
      objective: objective?.trim(),
      level: level || "principiante",
      days: days.map((day, dayIndex) => ({
        dayName: day.dayName.trim(),
        order: day.order || dayIndex + 1,
        exercises: day.exercises.map((item, exerciseIndex) => ({
          exerciseId: new Types.ObjectId(item.exerciseId),
          sets: item.sets,
          reps: item.reps.trim(),
          rest: item.rest.trim(),
          order: item.order || exerciseIndex + 1,
          notes: item.notes?.trim(),
        })),
      })),
      createdBy: authenticatedUser._id,
      active: true,
    });

    const populatedRoutine = await Routine.findOne({
      _id: routine._id,
      gymId: authenticatedUser.gymId,
    }).populate({
      path: "days.exercises.exerciseId",
      match: {
        gymId: authenticatedUser.gymId,
        active: true,
      },
      select:
        "name description videoUrl imageUrl muscles difficulty active",
    });

    res.status(201).json({
      message: "Rutina creada correctamente",
      routine: populatedRoutine,
    });
  } catch (error) {
    console.error("Error al crear rutina:", error);

    res.status(500).json({
      message: "Error interno al crear rutina",
    });
  }
};

export const getRoutines = async (
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

    const routines = await Routine.find({
      gymId: authenticatedUser.gymId,
      active: true,
    })
      .populate({
        path: "days.exercises.exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select:
          "name description videoUrl imageUrl muscles difficulty active",
      })
      .populate({
        path: "createdBy",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name lastName email role",
      })
      .sort({ createdAt: -1 });

    res.json({
      message: "Rutinas obtenidas correctamente",
      routines,
    });
  } catch (error) {
    console.error("Error al obtener rutinas:", error);

    res.status(500).json({
      message: "Error interno al obtener rutinas",
    });
  }
};

export const getRoutineById = async (
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
        message: "ID de rutina inválido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    })
      .populate({
        path: "days.exercises.exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select:
          "name description videoUrl imageUrl muscles difficulty active",
      })
      .populate({
        path: "createdBy",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name lastName email role",
      });

    if (!routine) {
      res.status(404).json({
        message: "Rutina no encontrada",
      });
      return;
    }

    res.json({
      message: "Rutina obtenida correctamente",
      routine,
    });
  } catch (error) {
    console.error("Error al obtener rutina:", error);

    res.status(500).json({
      message: "Error interno al obtener rutina",
    });
  }
};

export const updateRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;
    const { name, description, objective, level, days } =
      req.body as CreateRoutineBody;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de rutina inválido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!routine) {
      res.status(404).json({
        message: "Rutina no encontrada",
      });
      return;
    }

    if (!name?.trim()) {
      res.status(400).json({
        message: "El nombre de la rutina es obligatorio",
      });
      return;
    }

    if (!validateRoutineDays(days, res)) {
      return;
    }

    const exerciseIds = days.flatMap((day) =>
      day.exercises.map((item) => item.exerciseId)
    );

    const uniqueExerciseIds = [...new Set(exerciseIds)];

    const existingExercises = await Exercise.find({
      _id: { $in: uniqueExerciseIds },
      gymId: authenticatedUser.gymId,
      active: true,
    }).select("_id");

    if (existingExercises.length !== uniqueExerciseIds.length) {
      res.status(400).json({
        message:
          "Uno o más ejercicios no existen, están inactivos o pertenecen a otro gimnasio",
      });
      return;
    }

    routine.name = name.trim();
    routine.description = description?.trim();
    routine.objective = objective?.trim();
    routine.level = level || "principiante";
    routine.days = days.map((day, dayIndex) => ({
      dayName: day.dayName.trim(),
      order: day.order || dayIndex + 1,
      exercises: day.exercises.map((item, exerciseIndex) => ({
        exerciseId: new Types.ObjectId(item.exerciseId),
        sets: item.sets,
        reps: item.reps.trim(),
        rest: item.rest.trim(),
        order: item.order || exerciseIndex + 1,
        notes: item.notes?.trim(),
      })),
    })) as any;

    await routine.save();

    const populatedRoutine = await Routine.findOne({
      _id: routine._id,
      gymId: authenticatedUser.gymId,
    })
      .populate({
        path: "days.exercises.exerciseId",
        match: {
          gymId: authenticatedUser.gymId,
          active: true,
        },
        select:
          "name description videoUrl imageUrl muscles difficulty active",
      })
      .populate({
        path: "createdBy",
        match: {
          gymId: authenticatedUser.gymId,
        },
        select: "name lastName email role",
      });

    res.json({
      message: "Rutina actualizada correctamente",
      routine: populatedRoutine,
    });
  } catch (error) {
    console.error("Error al actualizar rutina:", error);

    res.status(500).json({
      message: "Error interno al actualizar rutina",
    });
  }
};

export const deleteRoutine = async (
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
        message: "ID de rutina inválido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!routine) {
      res.status(404).json({
        message: "Rutina no encontrada",
      });
      return;
    }

    routine.active = false;
    await routine.save();

    await User.updateMany(
      {
        gymId: authenticatedUser.gymId,
        role: "student",
        assignedRoutine: routine._id,
      },
      {
        $unset: {
          assignedRoutine: "",
        },
      }
    );

    res.json({
      message: "Rutina eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar rutina:", error);

    res.status(500).json({
      message: "Error interno al eliminar rutina",
    });
  }
};

export const assignRoutineToStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { routineId, studentId } = req.params;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      res.status(400).json({
        message: "ID de rutina inválido",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({
        message: "ID de alumno inválido",
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
        message: "Rutina no encontrada",
      });
      return;
    }

    const student = await User.findOne({
      _id: studentId,
      gymId: authenticatedUser.gymId,
      role: "student",
      active: true,
    });

    if (!student) {
      res.status(404).json({
        message: "Alumno no encontrado",
      });
      return;
    }

    student.assignedRoutine = routine._id as any;
    await student.save();

    res.json({
      message: "Rutina asignada correctamente",
      student: {
        id: student._id,
        gymId: student.gymId,
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        assignedRoutine: student.assignedRoutine,
      },
    });
  } catch (error) {
    console.error("Error al asignar rutina:", error);

    res.status(500).json({
      message: "Error interno al asignar rutina",
    });
  }
};

export const getMyRoutine = async (
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
        message: "Esta ruta es solo para alumnos",
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
    }).select("-password");

    if (!student) {
      res.status(403).json({
        message: "La cuenta del alumno no existe o está inactiva",
      });
      return;
    }

    if (!student.assignedRoutine) {
      res.status(404).json({
        message: "Todavía no tenés una rutina asignada",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: student.assignedRoutine,
      gymId: authenticatedUser.gymId,
      active: true,
    }).populate({
      path: "days.exercises.exerciseId",
      match: {
        gymId: authenticatedUser.gymId,
        active: true,
      },
      select:
        "name description videoUrl imageUrl muscles difficulty active",
    });

    if (!routine) {
      res.status(404).json({
        message: "La rutina asignada no existe o está inactiva",
      });
      return;
    }

    res.json({
      message: "Rutina asignada obtenida correctamente",
      routine,
    });
  } catch (error) {
    console.error("Error al obtener rutina del alumno:", error);

    res.status(500).json({
      message: "Error interno al obtener la rutina del alumno",
    });
  }
}; 