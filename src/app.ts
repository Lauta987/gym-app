import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import exerciseRoutes from "./routes/exercise.routes";
import routineRoutes from "./routes/routine.routes";
import workoutLogRoutes from "./routes/workoutLog.routes";

const app = express();

app.set("trust proxy", 1); 
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
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
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.send("API GymStart funcionando correctamente");
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/workout-logs", workoutLogRoutes);

export default app; 