"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No autorizado. Token no enviado",
            });
        }
        const token = authHeader.split(" ")[1];
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                message: "No se encontró JWT_SECRET en el archivo .env",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await user_model_1.User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                message: "No autorizado. Usuario no encontrado",
            });
        }
        if (!user.active) {
            return res.status(403).json({
                message: "Usuario desactivado",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado",
        });
    }
};
exports.protect = protect;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: "No autorizado",
            });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: "No tenés permisos para realizar esta acción",
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
