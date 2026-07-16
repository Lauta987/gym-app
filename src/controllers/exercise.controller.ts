import { Request, Response } from "express";
import mongoose from "mongoose";
import { Exercise } from "../models/exercise.model";

export const createExercise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;

    const {
      name,
      description,
      videoUrl,
      imageUrl,
      muscles,
      difficulty,
    } = req.body;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!name || !description) {
      res.status(400).json({
        message: "El nombre y la descripción son obligatorios",
      });
      return;
    }

    const normalizedName = name.trim();

    const exerciseExists = await Exercise.findOne({
      gymId: authenticatedUser.gymId,
      name: normalizedName,
      active: true,
    });

    if (exerciseExists) {
      res.status(400).json({
        message: "Ya existe un ejercicio con ese nombre en este gimnasio",
      });
      return;
    }

    const exercise = await Exercise.create({
      gymId: authenticatedUser.gymId,
      name: normalizedName,
      description: description.trim(),
      videoUrl: videoUrl?.trim(),
      imageUrl: imageUrl?.trim(),
      muscles: Array.isArray(muscles) ? muscles : [],
      difficulty: difficulty || "principiante",
      createdBy: authenticatedUser._id,
      active: true,
    });

    res.status(201).json({
      message: "Ejercicio creado correctamente",
      exercise,
    });
  } catch (error) {
    console.error("Error al crear ejercicio:", error);

    res.status(500).json({
      message: "Error interno al crear ejercicio",
    });
  }
};

export const getExercises = async (
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

    const exercises = await Exercise.find({
      gymId: authenticatedUser.gymId,
      active: true,
    }).sort({
      createdAt: -1,
    });

    res.json({
      message: "Ejercicios obtenidos correctamente",
      exercises,
    });
  } catch (error) {
    console.error("Error al obtener ejercicios:", error);

    res.status(500).json({
      message: "Error interno al obtener ejercicios",
    });
  }
};

export const getExerciseById = async (
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
        message: "ID de ejercicio inválido",
      });
      return;
    }

    const exercise = await Exercise.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!exercise) {
      res.status(404).json({
        message: "Ejercicio no encontrado",
      });
      return;
    }

    res.json({
      message: "Ejercicio obtenido correctamente",
      exercise,
    });
  } catch (error) {
    console.error("Error al obtener ejercicio:", error);

    res.status(500).json({
      message: "Error interno al obtener ejercicio",
    });
  }
};

export const updateExercise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    const {
      name,
      description,
      videoUrl,
      imageUrl,
      muscles,
      difficulty,
    } = req.body;

    if (!authenticatedUser?.gymId) {
      res.status(403).json({
        message: "El usuario no tiene un gimnasio asignado",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "ID de ejercicio inválido",
      });
      return;
    }

    const exercise = await Exercise.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!exercise) {
      res.status(404).json({
        message: "Ejercicio no encontrado",
      });
      return;
    }

    if (name && name.trim() !== exercise.name) {
      const exerciseExists = await Exercise.findOne({
        gymId: authenticatedUser.gymId,
        name: name.trim(),
        active: true,
        _id: { $ne: exercise._id },
      });

      if (exerciseExists) {
        res.status(400).json({
          message: "Ya existe un ejercicio con ese nombre en este gimnasio",
        });
        return;
      }
    }

    if (name) {
      exercise.name = name.trim();
    }

    if (description) {
      exercise.description = description.trim();
    }

    if (videoUrl !== undefined) {
      exercise.videoUrl = videoUrl?.trim() || undefined;
    }

    if (imageUrl !== undefined) {
      exercise.imageUrl = imageUrl?.trim() || undefined;
    }

    if (Array.isArray(muscles)) {
      exercise.muscles = muscles;
    }

    if (difficulty) {
      exercise.difficulty = difficulty;
    }

    await exercise.save();

    res.json({
      message: "Ejercicio actualizado correctamente",
      exercise,
    });
  } catch (error) {
    console.error("Error al actualizar ejercicio:", error);

    res.status(500).json({
      message: "Error interno al actualizar ejercicio",
    });
  }
};

export const deleteExercise = async (
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
        message: "ID de ejercicio inválido",
      });
      return;
    }

    const exercise = await Exercise.findOne({
      _id: id,
      gymId: authenticatedUser.gymId,
      active: true,
    });

    if (!exercise) {
      res.status(404).json({
        message: "Ejercicio no encontrado",
      });
      return;
    }

    exercise.active = false;
    await exercise.save();

    res.json({
      message: "Ejercicio eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar ejercicio:", error);

    res.status(500).json({
      message: "Error interno al eliminar ejercicio",
    });
  }
}; 