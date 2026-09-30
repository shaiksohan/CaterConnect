const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["worker", "provider"], default: "worker" },
  verified: { type: Boolean, default: false },
  bio: { type: String, default: "" },
  skills: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);