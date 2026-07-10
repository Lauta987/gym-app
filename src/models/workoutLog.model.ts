import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWorkoutLog extends Document {
  studentId: Types.ObjectId;
  routineId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  dayName: string;
  dayOrder: number;
  setsPlanned: number;
  repsPlanned: string;
  restPlanned: string;
  weight?: number;
  repsDone?: string;
  notes?: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workoutLogSchema = new Schema<IWorkoutLog>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routineId: {
      type: Schema.Types.ObjectId,
      ref: "Routine",
      required: true,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    dayName: {
      type: String,
      required: true,
      trim: true,
    },
    dayOrder: {
      type: Number,
      required: true,
    },
    setsPlanned: {
      type: Number,
      required: true,
    },
    repsPlanned: {
      type: String,
      required: true,
      trim: true,
    },
    restPlanned: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: false,
    },
    repsDone: {
      type: String,
      required: false,
      trim: true,
    },
    notes: {
      type: String,
      required: false,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

workoutLogSchema.index({ studentId: 1, completedAt: -1 });

export const WorkoutLog = mongoose.model<IWorkoutLog>(
  "WorkoutLog",
  workoutLogSchema
); 