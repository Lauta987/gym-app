"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const register = async (req, res) => {
    try {
        const { name, lastName, email, password, role } = req.body;
        if (!name || !lastName || !email || !password) {
            return res.status(400).json({
                message: "Todos los campos obligatorios deben estar completos",
            });
        }
        const userExists = await user_model_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: "Ya existe un usuario con ese email",
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.User.create({
            name,
            lastName,
            email,
            password: hashedPassword,
            role: role || "student",
        });
        return res.status(201).json({
            message: "Usuario registrado correctamente",
            user: {
                id: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error al registrar usuario",
            error,
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email y contraseña son obligatorios",
            });
        }
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Credenciales incorrectas",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Credenciales incorrectas",
            });
        }
        if (!user.active) {
            return res.status(403).json({
                message: "El usuario se encuentra desactivado",
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                message: "No se encontró JWT_SECRET en el archivo .env",
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role,
        }, jwtSecret, {
            expiresIn: "7d",
        });
        return res.json({
            message: "Login correcto",
            token,
            user: {
                id: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error al iniciar sesión",
            error,
        });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const user = req.user;
        return res.json({
            message: "Perfil obtenido correctamente",
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error al obtener perfil",
            error,
        });
    }
};
exports.getProfile = getProfile;
