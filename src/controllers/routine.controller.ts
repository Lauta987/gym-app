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

export const createRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, objective, level, days } =
      req.body as CreateRoutineBody;

    if (!name) {
      res.status(400).json({
        message: "El nombre de la rutina es obligatorio",
      });
      return;
    }

    if (!Array.isArray(days) || days.length === 0) {
      res.status(400).json({
        message: "La rutina debe tener al menos un día",
      });
      return;
    }

    for (const day of days) {
      if (!day.dayName) {
        res.status(400).json({
          message: "Cada día debe tener un nombre",
        });
        return;
      }

      if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
        res.status(400).json({
          message: "Cada día debe tener al menos un ejercicio",
        });
        return;
      }

      for (const item of day.exercises) {
        if (!item.exerciseId || !item.sets || !item.reps || !item.rest) {
          res.status(400).json({
            message: "Cada ejercicio debe tener exerciseId, sets, reps y rest",
          });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(item.exerciseId)) {
          res.status(400).json({
            message: "Uno de los exerciseId no es válido",
          });
          return;
        }
      }
    }

    const exerciseIds = days.flatMap((day) =>
      day.exercises.map((item) => item.exerciseId)
    );

    const uniqueExerciseIds = [...new Set(exerciseIds)];

    const existingExercises = await Exercise.find({
      _id: { $in: uniqueExerciseIds },
      active: true,
    });

    if (existingExercises.length !== uniqueExerciseIds.length) {
      res.status(400).json({
        message: "Uno o más ejercicios no existen o están inactivos",
      });
      return;
    }

    const user = (req as any).user;

    const routine = await Routine.create({
      name,
      description,
      objective,
      level: level || "principiante",
      days: days.map((day, dayIndex) => ({
        dayName: day.dayName,
        order: day.order || dayIndex + 1,
        exercises: day.exercises.map((item, exerciseIndex) => ({
          exerciseId: new Types.ObjectId(item.exerciseId),
          sets: item.sets,
          reps: item.reps,
          rest: item.rest,
          order: item.order || exerciseIndex + 1,
          notes: item.notes,
        })),
      })),
      createdBy: user?._id,
      active: true,
    });

    const populatedRoutine = await Routine.findById(routine._id).populate(
      "days.exercises.exerciseId",
      "name description videoUrl imageUrl muscles difficulty"
    );

    res.status(201).json({
      message: "Rutina creada correctamente",
      routine: populatedRoutine,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear rutina",
      error,
    });
  }
};

export const getRoutines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const routines = await Routine.find({ active: true })
      .populate(
        "days.exercises.exerciseId",
        "name description videoUrl imageUrl muscles difficulty"
      )
      .populate("createdBy", "name lastName email role")
      .sort({ createdAt: -1 });

    res.json({
      message: "Rutinas obtenidas correctamente",
      routines,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener rutinas",
      error,
    });
  }
};

export const getRoutineById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const routine = await Routine.findOne({
      _id: id,
      active: true,
    })
      .populate(
        "days.exercises.exerciseId",
        "name description videoUrl imageUrl muscles difficulty"
      )
      .populate("createdBy", "name lastName email role");

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
    res.status(500).json({
      message: "Error al obtener rutina",
      error,
    });
  }
};
export const updateRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, objective, level, days } =
      req.body as CreateRoutineBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de rutina inválido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: id,
      active: true,
    });

    if (!routine) {
      res.status(404).json({
        message: "Rutina no encontrada",
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        message: "El nombre de la rutina es obligatorio",
      });
      return;
    }

    if (!Array.isArray(days) || days.length === 0) {
      res.status(400).json({
        message: "La rutina debe tener al menos un día",
      });
      return;
    }

    for (const day of days) {
      if (!day.dayName) {
        res.status(400).json({
          message: "Cada día debe tener un nombre",
        });
        return;
      }

      if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
        res.status(400).json({
          message: "Cada día debe tener al menos un ejercicio",
        });
        return;
      }

      for (const item of day.exercises) {
        if (!item.exerciseId || !item.sets || !item.reps || !item.rest) {
          res.status(400).json({
            message: "Cada ejercicio debe tener exerciseId, sets, reps y rest",
          });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(item.exerciseId)) {
          res.status(400).json({
            message: "Uno de los exerciseId no es válido",
          });
          return;
        }
      }
    }

    const exerciseIds = days.flatMap((day) =>
      day.exercises.map((item) => item.exerciseId)
    );

    const uniqueExerciseIds = [...new Set(exerciseIds)];

    const existingExercises = await Exercise.find({
      _id: { $in: uniqueExerciseIds },
      active: true,
    });

    if (existingExercises.length !== uniqueExerciseIds.length) {
      res.status(400).json({
        message: "Uno o más ejercicios no existen o están inactivos",
      });
      return;
    }

    routine.name = name;
    routine.description = description;
    routine.objective = objective;
    routine.level = level || "principiante";
    routine.days = days.map((day, dayIndex) => ({
      dayName: day.dayName,
      order: day.order || dayIndex + 1,
      exercises: day.exercises.map((item, exerciseIndex) => ({
        exerciseId: new Types.ObjectId(item.exerciseId),
        sets: item.sets,
        reps: item.reps,
        rest: item.rest,
        order: item.order || exerciseIndex + 1,
        notes: item.notes,
      })),
    })) as any;

    await routine.save();

    const populatedRoutine = await Routine.findById(routine._id)
      .populate(
        "days.exercises.exerciseId",
        "name description videoUrl imageUrl muscles difficulty"
      )
      .populate("createdBy", "name lastName email role");

    res.json({
      message: "Rutina actualizada correctamente",
      routine: populatedRoutine,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar rutina",
      error,
    });
  }
};

export const deleteRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de rutina inválido",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: id,
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
      { assignedRoutine: routine._id },
      { $unset: { assignedRoutine: "" } }
    );

    res.json({
      message: "Rutina eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar rutina",
      error,
    });
  }
}; 
export const assignRoutineToStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routineId, studentId } = req.params;

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

    const student = await User.findOne({
      _id: studentId,
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
        name: student.name,
        lastName: student.lastName,
        email: student.email,
        assignedRoutine: student.assignedRoutine,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al asignar rutina",
      error,
    });
  }
};

export const getMyRoutine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (user.role !== "student") {
      res.status(403).json({
        message: "Esta ruta es solo para alumnos",
      });
      return;
    }

    const student = await User.findById(user._id).select("-password");

    if (!student || !student.assignedRoutine) {
      res.status(404).json({
        message: "Todavía no tenés una rutina asignada",
      });
      return;
    }

    const routine = await Routine.findOne({
      _id: student.assignedRoutine,
      active: true,
    }).populate(
      "days.exercises.exerciseId",
      "name description videoUrl imageUrl muscles difficulty"
    );

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
    res.status(500).json({
      message: "Error al obtener la rutina del alumno",
      error,
    });
  }
}; 