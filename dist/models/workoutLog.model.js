"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const workoutLogSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    routineId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Routine",
        required: true,
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
workoutLogSchema.index({ studentId: 1, completedAt: -1 });
exports.WorkoutLog = mongoose_1.default.model("WorkoutLog", workoutLogSchema);
