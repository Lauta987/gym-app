"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateStudent = exports.updateStudent = exports.getStudentById = exports.getStudents = exports.createStudent = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../models/user.model");
const createStudent = async (req, res) => {
    try {
        const { name, lastName, email, password } = req.body;
        if (!name || !lastName || !email || !password) {
            res.status(400).json({
                message: "Nombre, apellido, email y contraseña son obligatorios",
            });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const studentExists = await user_model_1.User.findOne({ email: normalizedEmail });
        if (studentExists) {
            res.status(400).json({
                message: "Ya existe un usuario con ese email",
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const student = await user_model_1.User.create({
            name,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
            active: true,
        });
        res.status(201).json({
            message: "Alumno creado correctamente",
            student: {
                _id: student._id,
                name: student.name,
                lastName: student.lastName,
                email: student.email,
                role: student.role,
                active: student.active,
                assignedRoutine: student.assignedRoutine,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al crear alumno",
            error,
        });
    }
};
exports.createStudent = createStudent;
const getStudents = async (req, res) => {
    try {
        const students = await user_model_1.User.find({ role: "student" })
            .select("-password")
            .populate("assignedRoutine", "name level objective")
            .sort({ createdAt: -1 });
        res.json({
            message: "Alumnos obtenidos correctamente",
            students,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener alumnos",
            error,
        });
    }
};
exports.getStudents = getStudents;
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "ID de alumno inválido",
            });
            return;
        }
        const student = await user_model_1.User.findOne({
            _id: id,
            role: "student",
        })
            .select("-password")
            .populate("assignedRoutine", "name level objective");
        if (!student) {
            res.status(404).json({
                message: "Alumno no encontrado",
            });
            return;
        }
        res.json({
            message: "Alumno obtenido correctamente",
            student,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al obtener alumno",
            error,
        });
    }
};
exports.getStudentById = getStudentById;
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, lastName, email, password, active } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "ID de alumno inválido",
            });
            return;
        }
        const student = await user_model_1.User.findOne({
            _id: id,
            role: "student",
        });
        if (!student) {
            res.status(404).json({
                message: "Alumno no encontrado",
            });
            return;
        }
        if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== student.email) {
                const emailExists = await user_model_1.User.findOne({ email: normalizedEmail });
                if (emailExists) {
                    res.status(400).json({
                        message: "Ya existe un usuario con ese email",
                    });
                    return;
                }
                student.email = normalizedEmail;
            }
        }
        if (name) {
            student.name = name;
        }
        if (lastName) {
            student.lastName = lastName;
        }
        if (password && password.trim().length > 0) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            student.password = hashedPassword;
        }
        if (typeof active === "boolean") {
            student.active = active;
        }
        await student.save();
        const updatedStudent = await user_model_1.User.findById(student._id)
            .select("-password")
            .populate("assignedRoutine", "name level objective");
        res.json({
            message: "Alumno actualizado correctamente",
            student: updatedStudent,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al actualizar alumno",
            error,
        });
    }
};
exports.updateStudent = updateStudent;
const deactivateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "ID de alumno inválido",
            });
            return;
        }
        const student = await user_model_1.User.findOne({
            _id: id,
            role: "student",
        });
        if (!student) {
            res.status(404).json({
                message: "Alumno no encontrado",
            });
            return;
        }
        student.active = false;
        await student.save();
        res.json({
            message: "Alumno desactivado correctamente",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error al desactivar alumno",
            error,
        });
    }
};
exports.deactivateStudent = deactivateStudent;
