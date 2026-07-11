"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentWorkoutLogs = exports.getMyWorkoutLogs = exports.createWorkoutLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const workoutLog_model_1 = require("../models/workoutLog.model");
const routine_model_1 = require("../models/routine.model");
const exercise_model_1 = require("../models/exercise.model");
const user_model_1 = require("../models/user.model");
const createWorkoutLog = async (req, res) => {
    try {
        const user = req.user;
        const { routineId, exerciseId, dayName, dayOrder, setsPlanned, repsPlanned, restPlanned, weight, repsDone, notes, } = req.body;
        if (user.role !== "student") {
            res.status(403).json({
                message: "Solo los alumnos pueden registrar progreso",
            });
            return;
        }
        if (!routineId ||
            !exerciseId ||
            !dayName ||
            !dayOrder ||
            !setsPlanned ||
            !repsPlanned ||
            !restPlanned) {
            res.status(400).json({
                message: "Faltan datos obligatorios para registrar el progreso",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(routineId)) {
            res.status(400).json({
                message: "El routineId no es válido",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(exerciseId)) {
            res.status(400).json({
                message: "El exerciseId no es válido",
            });
            return;
        }
        const routine = await routine_model_1.Routine.findOne({
            _id: routineId,
            active: true,
        });
        if (!routine) {
            res.status(404).json({
                message: "Rutina no encontrada",
            });
            return;
        }
        const exercise = await exercise_model_1.Exercise.findOne({
            _id: exerciseId,
            active: true,
        });
        if (!exercise) {
            res.status(404).json({
                message: "Ejercicio no encontrado",
            });
            return;
        }
        const workoutLog = await workoutLog_model_1.WorkoutLog.create({
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
        const populatedLog = await workoutLog_model_1.WorkoutLog.findById(workoutLog._id)
            .populate("exerciseId", "name description muscles difficulty")
            .populate("routineId", "name objective level");
        res.status(201).json({
            message: "Progreso registrado correctamente",
            workoutLog: populatedLog,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al registrar progreso",
            error,
        });
    }
};
exports.createWorkoutLog = createWorkoutLog;
const getMyWorkoutLogs = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "student") {
            res.status(403).json({
                message: "Solo los alumnos pueden ver su progreso",
            });
            return;
        }
        const workoutLogs = await workoutLog_model_1.WorkoutLog.find({
            studentId: user._id,
        })
            .populate("exerciseId", "name description muscles difficulty")
            .populate("routineId", "name objective level")
            .sort({ completedAt: -1 });
        res.json({
            message: "Progreso obtenido correctamente",
            workoutLogs,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener progreso",
            error,
        });
    }
};
exports.getMyWorkoutLogs = getMyWorkoutLogs;
const getStudentWorkoutLogs = async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({
                message: "El studentId no es válido",
            });
            return;
        }
        const student = await user_model_1.User.findOne({
            _id: studentId,
            role: "student",
        }).select("-password");
        if (!student) {
            res.status(404).json({
                message: "Alumno no encontrado",
            });
            return;
        }
        const workoutLogs = await workoutLog_model_1.WorkoutLog.find({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener progreso del alumno",
            error,
        });
    }
};
exports.getStudentWorkoutLogs = getStudentWorkoutLogs;
