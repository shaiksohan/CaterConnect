const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  type: { type: String, default: "general" }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);