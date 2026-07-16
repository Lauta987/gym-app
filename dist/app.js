"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const exercise_routes_1 = __importDefault(require("./routes/exercise.routes"));
const routine_routes_1 = __importDefault(require("./routes/routine.routes"));
const workoutLog_routes_1 = __importDefault(require("./routes/workoutLog.routes"));
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter((origin) => Boolean(origin));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        /*
         * Permite solicitudes que no vienen de un navegador,
         * como Postman o aplicaciones móviles.
         */
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "100kb" }));
app.get("/", (req, res) => {
    res.send("API GymStart funcionando correctamente");
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/students", student_routes_1.default);
app.use("/api/exercises", exercise_routes_1.default);
app.use("/api/routines", routine_routes_1.default);
app.use("/api/workout-logs", workoutLog_routes_1.default);
exports.default = app;
