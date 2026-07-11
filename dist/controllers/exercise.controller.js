"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExercise = exports.updateExercise = exports.getExerciseById = exports.getExercises = exports.createExercise = void 0;
const exercise_model_1 = require("../models/exercise.model");
const createExercise = async (req, res) => {
    try {
        const { name, description, videoUrl, imageUrl, muscles, difficulty } = req.body;
        if (!name || !description) {
            res.status(400).json({
                message: "El nombre y la descripción son obligatorios",
            });
            return;
        }
        const exerciseExists = await exercise_model_1.Exercise.findOne({ name });
        if (exerciseExists) {
            res.status(400).json({
                message: "Ya existe un ejercicio con ese nombre",
            });
            return;
        }
        const user = req.user;
        const exercise = await exercise_model_1.Exercise.create({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al crear ejercicio",
            error,
        });
    }
};
exports.createExercise = createExercise;
const getExercises = async (req, res) => {
    try {
        const exercises = await exercise_model_1.Exercise.find({ active: true }).sort({
            createdAt: -1,
        });
        res.json({
            message: "Ejercicios obtenidos correctamente",
            exercises,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener ejercicios",
            error,
        });
    }
};
exports.getExercises = getExercises;
const getExerciseById = async (req, res) => {
    try {
        const { id } = req.params;
        const exercise = await exercise_model_1.Exercise.findById(id);
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener ejercicio",
            error,
        });
    }
};
exports.getExerciseById = getExerciseById;
const updateExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, videoUrl, imageUrl, muscles, difficulty } = req.body;
        const exercise = await exercise_model_1.Exercise.findById(id);
        if (!exercise || !exercise.active) {
            res.status(404).json({
                message: "Ejercicio no encontrado",
            });
            return;
        }
        if (name && name !== exercise.name) {
            const exerciseExists = await exercise_model_1.Exercise.findOne({ name });
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al actualizar ejercicio",
            error,
        });
    }
};
exports.updateExercise = updateExercise;
const deleteExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const exercise = await exercise_model_1.Exercise.findById(id);
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al eliminar ejercicio",
            error,
        });
    }
};
exports.deleteExercise = deleteExercise;
