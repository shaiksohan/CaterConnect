const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nameSnapshot: String,
  phoneSnapshot: String,
  experience: String,
  message: String,
  status: { type: String, enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"], default: "Pending" }
}, { timestamps: true });

applicationSchema.index({ job: 1, worker: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);