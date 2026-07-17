 import mongoose, { Document, Schema } from "mongoose";

export type GymPlan = "basic" | "personalized" | "premium";

export interface IGym extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: GymPlan;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gymSchema = new Schema<IGym>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 60,
    },

    logoUrl: {
      type: String,
      trim: true,
    },

    primaryColor: {
      type: String,
      trim: true,
      default: "#ff5a1f",
    },

    secondaryColor: {
      type: String,
      trim: true,
      default: "#111111",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    plan: {
      type: String,
      enum: ["basic", "personalized", "premium"],
      default: "basic",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

gymSchema.index({
  active: 1,
  createdAt: -1,
});

export const Gym = mongoose.model<IGym>("Gym", gymSchema); 