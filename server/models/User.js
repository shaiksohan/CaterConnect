const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
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

    phone: {
      type: String,
      default: "",
    },

    passwordHash: {
      type: String,
      default: "",
    },

    // Google Login
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    role: {
      type: String,
      enum: ["worker", "provider", "admin"],
      required: true,
    },

    // Profile information
    profilePhoto: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    experience: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    // Verification
    verified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["Not Requested", "Pending", "Approved", "Rejected"],
      default: "Not Requested",
    },

    // Ratings
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);