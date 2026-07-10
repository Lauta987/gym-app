import { Request, Response } from "express";
import { Exercise } from "../models/exercise.model";

export const createExercise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, videoUrl, imageUrl, muscles, difficulty } =
      req.body;

    if (!name || !description) {
      res.status(400).json({
        message: "El nombre y la descripción son obligatorios",
      });
      return;
    }

    const exerciseExists = await Exercise.findOne({ name });

    if (exerciseExists) {
      res.status(400).json({
        message: "Ya existe un ejercicio con ese nombre",
      });
      return;
    }

    const user = (req as any).user;

    const exercise = await Exercise.create({
      name,
      description,
      videoUrl,
      imageUrl,
      muscles: muscles || [],
      difficulty: difficulty || "principiante",
      createdBy: user?._id,
    });

    res.status(201).json({
      message: "Ejercicio creado correctamente",
      exercise,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear ejercicio",
      error,
    });
  }
};

export const getExercises = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const exercises = await Exercise.find({ active: true }).sort({
      createdAt: -1,
    });

    res.json({
      message: "Ejercicios obtenidos correctamente",
      exercises,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener ejercicios",
      error,
    });
  }
};

export const getExerciseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findById(id);

    if (!exercise || !exercise.active) {
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
    res.status(500).json({
      message: "Error al obtener ejercicio",
      error,
    });
  }
};

export const updateExercise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, videoUrl, imageUrl, muscles, difficulty } =
      req.body;

    const exercise = await Exercise.findById(id);

    if (!exercise || !exercise.active) {
      res.status(404).json({
        message: "Ejercicio no encontrado",
      });
      return;
    }

    if (name && name !== exercise.name) {
      const exerciseExists = await Exercise.findOne({ name });

      if (exerciseExists) {
        res.status(400).json({
          message: "Ya existe un ejercicio con ese nombre",
        });
        return;
      }
    }

    exercise.name = name || exercise.name;
    exercise.description = description || exercise.description;
    exercise.videoUrl = videoUrl ?? exercise.videoUrl;
    exercise.imageUrl = imageUrl ?? exercise.imageUrl;
    exercise.muscles = muscles || exercise.muscles;
    exercise.difficulty = difficulty || exercise.difficulty;

    await exercise.save();

    res.json({
      message: "Ejercicio actualizado correctamente",
      exercise,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar ejercicio",
      error,
    });
  }
};

export const deleteExercise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findById(id);

    if (!exercise || !exercise.active) {
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
    res.status(500).json({
      message: "Error al eliminar ejercicio",
      error,
    });
  }
}; 