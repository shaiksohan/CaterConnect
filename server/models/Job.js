const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, default: "General" },
  description: { type: String, default: "" },
  location: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  payment: { type: Number, required: true, min: 0 },
  workersNeeded: { type: Number, required: true, min: 1 },
  workersFilled: { type: Number, default: 0 },
  requirements: [{ type: String }],
  status: { type: String, enum: ["Open", "Filled", "Completed", "Cancelled"], default: "Open" },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);