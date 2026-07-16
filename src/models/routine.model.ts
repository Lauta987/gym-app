import mongoose, { Document, Schema, Types } from "mongoose";

export type RoutineLevel = "principiante" | "intermedio" | "avanzado";

export interface IRoutineExercise {
  exerciseId: Types.ObjectId;
  sets: number;
  reps: string;
  rest: string;
  order: number;
  notes?: string;
}

export interface IRoutineDay {
  dayName: string;
  order: number;
  exercises: IRoutineExercise[];
}

export interface IRoutine extends Document {
  gymId?: Types.ObjectId;
  name: string;
  description?: string;
  objective?: string;
  level: RoutineLevel;
  days: IRoutineDay[];
  active: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const routineExerciseSchema = new Schema<IRoutineExercise>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },

    sets: {
      type: Number,
      required: true,
    },

    reps: {
      type: String,
      required: true,
      trim: true,
    },

    rest: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
    },

    notes: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const routineDaySchema = new Schema<IRoutineDay>(
  {
    dayName: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
    },

    exercises: {
      type: [routineExerciseSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const routineSchema = new Schema<IRoutine>(
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
      required: false,
      trim: true,
    },

    objective: {
      type: String,
      required: false,
      trim: true,
    },

    level: {
      type: String,
      enum: ["principiante", "intermedio", "avanzado"],
      default: "principiante",
    },

    days: {
      type: [routineDaySchema],
      default: [],
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

routineSchema.index({
  gymId: 1,
  active: 1,
  createdAt: -1,
});

export const Routine = mongoose.model<IRoutine>(
  "Routine",
  routineSchema
); 