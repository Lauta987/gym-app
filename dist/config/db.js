"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("No se encontró la variable MONGO_URI en el archivo .env");
        }
        await mongoose_1.default.connect(mongoUri);
        console.log("MongoDB conectado correctamente");
    }
    catch (error) {
        console.error("Error al conectar MongoDB:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
