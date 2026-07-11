"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyRoutine = exports.assignRoutineToStudent = exports.getRoutineById = exports.getRoutines = exports.createRoutine = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const routine_model_1 = require("../models/routine.model");
const exercise_model_1 = require("../models/exercise.model");
const user_model_1 = require("../models/user.model");
const createRoutine = async (req, res) => {
    try {
        const { name, description, objective, level, days } = req.body;
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
                if (!mongoose_1.default.Types.ObjectId.isValid(item.exerciseId)) {
                    res.status(400).json({
                        message: "Uno de los exerciseId no es válido",
                    });
                    return;
                }
            }
        }
        const exerciseIds = days.flatMap((day) => day.exercises.map((item) => item.exerciseId));
        const uniqueExerciseIds = [...new Set(exerciseIds)];
        const existingExercises = await exercise_model_1.Exercise.find({
            _id: { $in: uniqueExerciseIds },
            active: true,
        });
        if (existingExercises.length !== uniqueExerciseIds.length) {
            res.status(400).json({
                message: "Uno o más ejercicios no existen o están inactivos",
            });
            return;
        }
        const user = req.user;
        const routine = await routine_model_1.Routine.create({
            name,
            description,
            objective,
            level: level || "principiante",
            days: days.map((day, dayIndex) => ({
                dayName: day.dayName,
                order: day.order || dayIndex + 1,
                exercises: day.exercises.map((item, exerciseIndex) => ({
                    exerciseId: new mongoose_1.Types.ObjectId(item.exerciseId),
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
        const populatedRoutine = await routine_model_1.Routine.findById(routine._id).populate("days.exercises.exerciseId", "name description videoUrl imageUrl muscles difficulty");
        res.status(201).json({
            message: "Rutina creada correctamente",
            routine: populatedRoutine,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al crear rutina",
            error,
        });
    }
};
exports.createRoutine = createRoutine;
const getRoutines = async (req, res) => {
    try {
        const routines = await routine_model_1.Routine.find({ active: true })
            .populate("days.exercises.exerciseId", "name description videoUrl imageUrl muscles difficulty")
            .populate("createdBy", "name lastName email role")
            .sort({ createdAt: -1 });
        res.json({
            message: "Rutinas obtenidas correctamente",
            routines,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener rutinas",
            error,
        });
    }
};
exports.getRoutines = getRoutines;
const getRoutineById = async (req, res) => {
    try {
        const { id } = req.params;
        const routine = await routine_model_1.Routine.findOne({
            _id: id,
            active: true,
        })
            .populate("days.exercises.exerciseId", "name description videoUrl imageUrl muscles difficulty")
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener rutina",
            error,
        });
    }
};
exports.getRoutineById = getRoutineById;
const assignRoutineToStudent = async (req, res) => {
    try {
        const { routineId, studentId } = req.params;
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
        const student = await user_model_1.User.findOne({
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
        student.assignedRoutine = routine._id;
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al asignar rutina",
            error,
        });
    }
};
exports.assignRoutineToStudent = assignRoutineToStudent;
const getMyRoutine = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "student") {
            res.status(403).json({
                message: "Esta ruta es solo para alumnos",
            });
            return;
        }
        const student = await user_model_1.User.findById(user._id).select("-password");
        if (!student || !student.assignedRoutine) {
            res.status(404).json({
                message: "Todavía no tenés una rutina asignada",
            });
            return;
        }
        const routine = await routine_model_1.Routine.findOne({
            _id: student.assignedRoutine,
            active: true,
        }).populate("days.exercises.exerciseId", "name description videoUrl imageUrl muscles difficulty");
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener la rutina del alumno",
            error,
        });
    }
};
exports.getMyRoutine = getMyRoutine;
