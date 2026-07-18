import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import exerciseRoutes from "./routes/exercise.routes";
import routineRoutes from "./routes/routine.routes";
import workoutLogRoutes from "./routes/workoutLog.routes";
import gymRoutes from "./routes/gym.routes";
import publicGymRoutes from "./routes/publicGym.routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Permite solicitudes sin origin, como Postman
       * o algunas solicitudes internas.
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

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "100kb" }));

/*
 * Ruta principal para comprobar que la API está funcionando.
 */
app.get("/", (_req, res) => {
  res.send("API GymStart funcionando correctamente");
});

/*
 * Ruta temporal de prueba.
 * Sirve para confirmar que se está ejecutando este app.ts.
 */
app.get("/api/public/test", (_req, res) => {
  res.json({
    message: "La versión nueva del backend está funcionando",
  });
});

/*
 * Autenticación.
 */
app.use("/api/auth", authRoutes);

/*
 * Rutas públicas de gimnasios.
 *
 * No requieren autenticación porque el navegador debe
 * poder cargar la información y el manifiesto de la PWA
 * antes de iniciar sesión.
 */
app.use("/api/public/gyms", publicGymRoutes);

/*
 * Rutas privadas de administradores, entrenadores y alumnos.
 */
app.use("/api/students", studentRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/workout-logs", workoutLogRoutes);

/*
 * Gestión privada de gimnasios para el superadministrador.
 */
app.use("/api/gyms", gymRoutes);

export default app; 