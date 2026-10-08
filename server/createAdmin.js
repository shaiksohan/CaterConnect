const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const existingAdmin = await User.findOne({
      email: "admin@caterconnect.com",
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(
      "Admin@12345",
      10
    );

    await User.create({
      name: "CaterConnect Admin",
      email: "admin@caterconnect.com",
      passwordHash,
      phone: "9999999999",
      role: "admin",
      verified: true,
      verificationStatus: "Approved",
    });

    console.log("=================================");
    console.log("Admin account created successfully.");
    console.log("Email: admin@caterconnect.com");
    console.log("Password: Admin@12345");
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }
}

createAdmin();