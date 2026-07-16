import mongoose, { Document, Schema } from "mongoose";

export interface IGym extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
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

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Gym = mongoose.model<IGym>("Gym", gymSchema); 