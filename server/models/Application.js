const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Completed"],
      default: "Pending",
    },

    // -----------------------------
    // Payment Information
    // -----------------------------

    paymentStatus: {
      type: String,
      enum: ["Not Due", "Pending", "Paid"],
      default: "Not Due",
    },

    paymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["Manual", "Razorpay", "Other"],
      default: "Manual",
    },

    transactionId: {
      type: String,
      default: "",
    },

    // -----------------------------
    // Application Information
    // -----------------------------

    nameSnapshot: {
      type: String,
      default: "",
    },

    phoneSnapshot: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);