import mongoose, { Document, Schema, Types } from "mongoose";

export type ExerciseDifficulty = "principiante" | "intermedio" | "avanzado";

export interface IExercise extends Document {
  gymId?: Types.ObjectId;
  name: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  muscles: string[];
  difficulty: ExerciseDifficulty;
  active: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: false,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    videoUrl: {
      type: String,
      required: false,
      trim: true,
    },

    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },

    muscles: {
      type: [String],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["principiante", "intermedio", "avanzado"],
      default: "principiante",
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.index({
  gymId: 1,
  active: 1,
  createdAt: -1,
});

export const Exercise = mongoose.model<IExercise>(
  "Exercise",
  exerciseSchema
); 