import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import exerciseRoutes from "./routes/exercise.routes";
import routineRoutes from "./routes/routine.routes";
import workoutLogRoutes from "./routes/workoutLog.routes"; 

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/workout-logs", workoutLogRoutes);

app.get("/", (req, res) => {
  res.send("API GymStart funcionando correctamente");
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/routines", routineRoutes);

export default app; 