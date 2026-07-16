import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "admin" | "trainer" | "student";

export interface IUser extends Document {
  gymId?: Types.ObjectId;
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  assignedRoutine?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
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

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "trainer", "student"],
      default: "student",
    },

    active: {
      type: Boolean,
      default: true,
    },

    assignedRoutine: {
      type: Schema.Types.ObjectId,
      ref: "Routine",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  gymId: 1,
  role: 1,
  active: 1,
});

export const User = mongoose.model<IUser>("User", userSchema);