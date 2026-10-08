const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
require("dotenv").config();


const { OAuth2Client } = require("google-auth-library");
const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Payment = require("./models/Payment");


const Notification = require("./models/Notification");
const Review = require("./models/Review");
const Message = require("./models/Message");
const { auth, role } = require("./middleware/auth");
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

const mongoReady = mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err.message));

const validId = value => mongoose.isValidObjectId(value);
function isJobExpired(job) {
  if (!job?.date || !job?.endTime) {
    return false;
  }

  const end = new Date(
    `${job.date} ${job.endTime}`
  );

  if (Number.isNaN(end.getTime())) {
    return false;
  }

  return new Date() >= end;
}

const tokenFor = user => jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });

async function requireDb(req,res,next){ try { await mongoose.connection.asPromise(); next(); } catch { res.status(503).json({message:"Database is not connected. Check server/.env MONGO_URI."}); } }

app.get("/", (req,res) => res.json({ message:"CaterConnect API is running" }));
app.use("/api", requireDb);

app.post("/api/auth/register", async (req,res) => {
  try {
    const { name,email,password,phone,role: accountRole="worker" } = req.body;
    if (!name || !email || !password) return res.status(400).json({message:"Name, email and password are required"});
    if (!["worker","provider"].includes(accountRole)) return res.status(400).json({message:"Invalid role"});
    if (await User.findOne({email:email.toLowerCase()})) return res.status(409).json({message:"Email already registered"});
    const passwordHash = await bcrypt.hash(password,10);
    const user = await User.create({name,email:email.toLowerCase(),passwordHash,phone,role:accountRole});
    res.status(201).json({token:tokenFor(user), user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  } catch(e) { res.status(500).json({message:e.message}); }
});

app.post("/api/auth/login", async (req,res) => {
  try {
    const {email,password} = req.body;
    const user = await User.findOne({email:email?.toLowerCase()});
    if (!user || !(await bcrypt.compare(password || "",user.passwordHash))) return res.status(401).json({message:"Invalid email or password"});
    res.json({token:tokenFor(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  } catch(e) { res.status(500).json({message:e.message}); }
});
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential, role: accountRole = "worker" } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    if (!["worker", "provider"].includes(accountRole)) {
      return res.status(400).json({
        message: "Invalid account role",
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({
        message: "Google account email is not verified",
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture || "";

    // Find existing Google account
    let user = await User.findOne({ googleId });

    // If not found, check whether email already exists
    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Link Google login to existing account
        user.googleId = googleId;

        if (!user.profilePhoto && picture) {
          user.profilePhoto = picture;
        }

        await user.save();
      }
    }

    // Create new account
    if (!user) {
      user = await User.create({
        name,
        email,
        passwordHash: "",
        googleId,
        authProvider: "google",
        role: accountRole,
        profilePhoto: picture,
      });
    }

    res.json({
      token: tokenFor(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    res.status(401).json({
      message: "Google authentication failed",
    });
  }
});

app.get("/api/me", auth, (req,res) => {
  const u=req.user;
  res.json({id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role,verified:u.verified,bio:u.bio,skills:u.skills,rating:u.rating,reviewCount:u.reviewCount});
});
// Get logged-in user's profile
app.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
// Update logged-in user's profile
app.put("/api/profile", auth, async (req, res) => {
  try {
    const { name, phone, bio, skills, experience, location, profilePhoto } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (experience !== undefined) user.experience = experience.trim();
    if (location !== undefined) user.location = location.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto.trim();

    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills.map(skill => String(skill).trim()).filter(Boolean)
        : [];
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        location: user.location,
        verified: user.verified,
        rating: user.rating,
        reviewCount: user.reviewCount
      }
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});
// Get another user's public profile
app.get("/api/users/:id/profile", auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(req.params.id)
      .select(
        "name role profilePhoto bio skills experience location verified rating reviewCount"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.post("/api/verification/request", auth, async (req, res) => {
  // ===============================
// ADMIN VERIFICATION ROUTES
// ===============================

app.get(
  "/api/admin/verifications",
  auth,
  role("admin"),
  async (req, res) => {
    try {
      const users = await User.find({
        verificationStatus: "Pending",
      }).select(
        "name email phone role location bio skills experience profilePhoto verificationStatus verified createdAt"
      );

      res.json(users);
    } catch (e) {
      console.error("Load verification requests error:", e);

      res.status(500).json({
        message: e.message,
      });
    }
  }
);

app.patch(
  "/api/admin/verifications/:id",
  auth,
  role("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          message: "Invalid verification status.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (user.verificationStatus !== "Pending") {
        return res.status(400).json({
          message: "This verification request is not pending.",
        });
      }

      user.verificationStatus = status;
      user.verified = status === "Approved";

      await user.save();
      await Notification.create({
  user: user._id,
  title:
    status === "Approved"
      ? "Verification approved"
      : "Verification rejected",
  message:
    status === "Approved"
      ? "Your CaterConnect account has been verified successfully."
      : "Your CaterConnect verification request was rejected. You may review your profile and request verification again.",
  type: "verification",
});
      res.json({
        message:
          status === "Approved"
            ? "User verification approved successfully."
            : "User verification rejected successfully.",
        user: {
          id: user._id,
          name: user.name,
          verificationStatus: user.verificationStatus,
          verified: user.verified,
        },
      });
    } catch (e) {
      console.error("Update verification error:", e);

      res.status(500).json({
        message: e.message,
      });
    }
  }
);
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        message: "Your account is already verified.",
      });
    }

    if (user.verificationStatus === "Pending") {
      return res.status(400).json({
        message: "Your verification request is already pending.",
      });
    }

    user.verificationStatus = "Pending";

    await user.save();

    res.json({
      message: "Verification request submitted successfully.",
      verificationStatus: user.verificationStatus,
    });
  } catch (e) {
    console.error("Verification request error:", e);

    res.status(500).json({
      message: e.message,
    });
  }
});
// ===============================
// ADMIN VERIFICATION ROUTES
// ===============================
// ===============================
// VERIFICATION ROUTES
// ===============================

// User requests verification
app.post(
  "/api/verification/request",
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.verified) {
        return res.status(400).json({
          message: "Your account is already verified.",
        });
      }

      if (user.verificationStatus === "Pending") {
        return res.status(400).json({
          message: "Your verification request is already pending.",
        });
      }

      user.verificationStatus = "Pending";

      await user.save();

      res.json({
        message: "Verification request submitted successfully.",
        verificationStatus: user.verificationStatus,
      });
    } catch (e) {
      console.error("Verification request error:", e);

      res.status(500).json({
        message: e.message,
      });
    }
  }
);


// ===============================
// ADMIN VERIFICATION ROUTES
// ===============================

// Get pending verification requests
app.get(
  "/api/admin/verifications",
  auth,
  role("admin"),
  async (req, res) => {
    try {
      const users = await User.find({
        verificationStatus: "Pending",
      }).select(
        "name email phone role location bio skills experience profilePhoto verificationStatus verified createdAt"
      );

      res.json(users);
    } catch (e) {
      console.error(
        "Load verification requests error:",
        e
      );

      res.status(500).json({
        message: e.message,
      });
    }
  }
);


// Approve or reject verification
app.patch(
  "/api/admin/verifications/:id",
  auth,
  role("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          message: "Invalid verification status.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (user.verificationStatus !== "Pending") {
        return res.status(400).json({
          message:
            "This verification request is not pending.",
        });
      }

      user.verificationStatus = status;
      user.verified = status === "Approved";

      await user.save();

      // Create notification for the user
      await Notification.create({
        user: user._id,

        title:
          status === "Approved"
            ? "Verification approved"
            : "Verification rejected",

        message:
          status === "Approved"
            ? "Your CaterConnect account has been verified successfully."
            : "Your CaterConnect verification request was rejected. You may review your profile and request verification again.",

        type: "verification",
      });

      res.json({
        message:
          status === "Approved"
            ? "User verification approved successfully."
            : "User verification rejected successfully.",

        user: {
          id: user._id,
          name: user.name,
          verificationStatus:
            user.verificationStatus,
          verified: user.verified,
        },
      });
    } catch (e) {
      console.error(
        "Update verification error:",
        e
      );

      res.status(500).json({
        message: e.message,
      });
    }
  }
);
app.get("/api/jobs", async (req, res) => {
  try {
    const {
      search,
      type,
      status = "Open",
      location,
      minPayment,
      date,
      sort = "newest",
    } = req.query;

    const q = {};

    // Only show open jobs
    if (status) {
      q.status = status;
    }

    // Never show jobs that already reached the worker limit
    q.$expr = {
      $lt: ["$workersFilled", "$workersNeeded"],
    };

    if (type && type !== "All") {
      q.type = type;
    }

    if (location) {
      q.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (search) {
      q.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          location: {
            $regex: search,
            $options: "i",
          },
        },
        {
          type: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (minPayment) {
      const payment = Number(minPayment);

      if (Number.isFinite(payment)) {
        q.payment = {
          $gte: payment,
        };
      }
    }

    if (date) {
      q.date = date;
    }

    let sortOption = { createdAt: -1 };

    if (sort === "paymentHigh") {
      sortOption = { payment: -1 };
    } else if (sort === "paymentLow") {
      sortOption = { payment: 1 };
    } else if (sort === "date") {
      sortOption = { date: 1, startTime: 1 };
    }

    const jobs = await Job.find(q)
      .populate(
        "provider",
        "name verified rating reviewCount"
      )
      .sort(sortOption);

    // Remove jobs whose end time has already passed
    const availableJobs = jobs.filter(
      (job) => !isJobExpired(job)
    );

    res.json(availableJobs);
  } catch (e) {
    console.error("Load jobs error:", e);

    res.status(500).json({
      message: e.message,
    });
  }
});
app.get("/api/jobs/:id", async (req,res) => {
  try {
    const job=await Job.findById(req.params.id).populate("provider","name email phone verified rating reviewCount bio");
    if(!job) return res.status(404).json({message:"Job not found"});
    res.json(job);
  } catch(e) { res.status(500).json({message:e.message}); }
});

app.post("/api/jobs", auth, role("provider"), async (req,res) => {
  try {
    const job=await Job.create({...req.body,provider:req.user._id});
    res.status(201).json(job);
  } catch(e) { res.status(400).json({message:e.message}); }
});

app.patch("/api/jobs/:id/status", auth, role("provider"), async (req,res) => {
  try {
    if(!validId(req.params.id)) return res.status(400).json({message:"Invalid job id"});
    const allowed=["Open","Filled","Completed","Cancelled"];
    if(!allowed.includes(req.body.status)) return res.status(400).json({message:"Invalid job status"});
    const job=await Job.findOne({_id:req.params.id,provider:req.user._id});
    if(!job) return res.status(404).json({message:"Job not found"});
    job.status=req.body.status;
    await job.save();
    res.json(job);
  } catch(e) { res.status(400).json({message:e.message}); }
});

app.get("/api/provider/jobs", auth, role("provider"), async (req,res) => {
  const jobs=await Job.find({provider:req.user._id}).sort({createdAt:-1});
  res.json(jobs);
});
app.patch("/api/jobs/:id/cancel", auth, role("provider"), async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid job id",
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // Only the provider who created the job can cancel it
    if (String(job.provider) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You are not allowed to cancel this job",
      });
    }

    // Prevent cancelling an already finished/cancelled job
    if (job.status === "Completed") {
      return res.status(400).json({
        message: "Completed jobs cannot be cancelled",
      });
    }

    if (job.status === "Cancelled") {
      return res.status(400).json({
        message: "This job is already cancelled",
      });
    }

    job.status = "Cancelled";
    await job.save();

    // Notify all applicants
    const applications = await Application.find({
      job: job._id,
    });

    if (applications.length) {
      await Notification.insertMany(
        applications.map((application) => ({
          user: application.worker,
          title: "Job cancelled",
          message: `The job "${job.title}" has been cancelled by the provider.`,
          type: "application",
        }))
      );
    }

    res.json({
      message: "Job cancelled successfully",
      job,
    });
  } catch (e) {
    console.error("Cancel job error:", e);

    res.status(500).json({
      message: e.message,
    });
  }
});
app.post("/api/applications", auth, role("worker"), async (req, res) => {
  try {
    if (!validId(req.body.jobId)) {
      return res.status(400).json({
        message: "Invalid job id",
      });
    }

    const job = await Job.findById(req.body.jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // Job is no longer accepting applications
    if (job.status !== "Open") {
      return res.status(400).json({
        message: "This job is no longer accepting applications.",
      });
    }

    // Worker limit reached
    if (job.workersFilled >= job.workersNeeded) {
      return res.status(400).json({
        message: "This job has already reached the required number of workers.",
      });
    }

    // Event has already ended
    if (isJobExpired(job)) {
      return res.status(400).json({
        message: "This job has already ended.",
      });
    }

    const existing = await Application.findOne({
      job: job._id,
      worker: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        message: "You already applied for this job",
      });
    }

    const application = await Application.create({
      job: job._id,
      worker: req.user._id,
      nameSnapshot: req.user.name,
      phoneSnapshot: req.user.phone,
      experience: req.body.experience,
      message: req.body.message,
    });

    await Notification.create({
      user: job.provider,
      title: "New application",
      message: `${req.user.name} applied for ${job.title}`,
      type: "application",
    });

    res.status(201).json(application);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});
app.get("/api/my/applications", auth, role("worker"), async (req,res) => {
  const apps=await Application.find({worker:req.user._id}).populate({path:"job",populate:{path:"provider",select:"name verified rating"} }).sort({createdAt:-1});
  res.json(apps);
});

app.get("/api/jobs/:id/applications", auth, role("provider"), async (req,res) => {
  const job=await Job.findOne({_id:req.params.id,provider:req.user._id});
  if(!job) return res.status(404).json({message:"Job not found"});
  const apps=await Application.find({job:job._id}).populate("worker","name email phone verified rating reviewCount");
  res.json(apps);
});

app.patch("/api/applications/:id/status", auth, role("provider"), async (req,res) => {
  const appItem=await Application.findById(req.params.id).populate("job");
  if(!appItem || String(appItem.job.provider)!==String(req.user._id)) return res.status(404).json({message:"Application not found"});
  const allowed=["Pending","Accepted","Rejected","Completed"];
  if(!allowed.includes(req.body.status)) return res.status(400).json({message:"Invalid status"});
  if(appItem.status === req.body.status) return res.json(appItem);
  if(appItem.status !== "Pending" && req.body.status !== "Completed") return res.status(400).json({message:"This application can no longer be changed"});
 if (req.body.status === "Accepted") {
  const job = await Job.findOneAndUpdate(
    {
      _id: appItem.job._id,
      status: "Open",
      $expr: {
        $lt: ["$workersFilled", "$workersNeeded"],
      },
    },
    {
      $inc: {
        workersFilled: 1,
      },
    },
    {
      new: true,
    }
  );

  if (!job) {
    return res.status(400).json({
      message:
        "No worker slots are available. Another applicant may have already filled the remaining slot.",
    });
  }

  // Set payment information for the accepted worker
  appItem.paymentAmount = job.payment;
  appItem.paymentStatus = "Pending";
  appItem.paymentMethod = "Manual";

  if (job.workersFilled >= job.workersNeeded) {
    job.status = "Filled";
    await job.save();
  }
}
  appItem.status=req.body.status;
  await appItem.save();
  await Notification.create({user:appItem.worker,title:`Application ${appItem.status}`,message:`Your application for ${appItem.job.title} is ${appItem.status.toLowerCase()}.`,type:"application"});
  res.json(appItem);
});
// ==================== PAYMENT ====================

// Provider marks an accepted/completed worker as paid
app.patch(
  "/api/applications/:id/payment",
  auth,
  role("provider"),
  async (req, res) => {
    try {
      const appItem = await Application.findById(
        req.params.id
      ).populate("job");

      if (!appItem) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      // Only the job's provider can mark the worker as paid
      if (
        String(appItem.job.provider) !==
        String(req.user._id)
      ) {
        return res.status(403).json({
          message: "You are not allowed to update this payment",
        });
      }

      // Worker must have completed the work
      if (appItem.status !== "Completed") {
        return res.status(400).json({
          message:
            "Payment can only be made after the work is completed.",
        });
      }

      // Prevent paying twice
      if (appItem.paymentStatus === "Paid") {
        return res.status(400).json({
          message: "This payment has already been completed.",
        });
      }

      appItem.paymentStatus = "Paid";
      appItem.paymentMethod = "Manual";
      appItem.paidAt = new Date();

      // Generate a simple transaction reference
      appItem.transactionId =
        "CC-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 1000);

      await appItem.save();

      // Notify worker
      await Notification.create({
        user: appItem.worker,
        title: "Payment received",
        message: `You received ₹${appItem.paymentAmount} for "${appItem.job.title}".`,
        type: "payment",
      });

      res.json({
        message: "Payment marked as paid successfully.",
        application: appItem,
      });
    } catch (e) {
      console.error("Payment update error:", e);

      res.status(500).json({
        message: e.message,
      });
    }
  }
);
app.post("/api/applications/:id/payment/order", auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("worker");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Only the job provider can create the payment
    if (String(application.job.provider) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Only the job provider can initiate this payment",
      });
    }

    // Payment should only happen after completed work
    if (application.status !== "Completed") {
      return res.status(400).json({
        message: "Payment can only be made after work is completed",
      });
    }

    // Don't create another payment if already paid
    const existingPayment = await Payment.findOne({
      application: application._id,
    });

    if (existingPayment?.status === "Paid") {
      return res.status(400).json({
        message: "This application has already been paid",
      });
    }

    const amount = Number(application.job.payment);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    // Razorpay amount is in paise
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `cc_${application._id}`,
    });

    let payment = existingPayment;

    if (!payment) {
      payment = await Payment.create({
        application: application._id,
        job: application.job._id,
        provider: application.job.provider,
        worker: application.worker._id,
        amount,
        currency: "INR",
        status: "Created",
        razorpayOrderId: order.id,
      });
    } else {
      payment.razorpayOrderId = order.id;
      payment.amount = amount;
      payment.status = "Created";
      await payment.save();
    }

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      message: "Unable to create payment order",
    });
  }
});


const crypto = require("crypto");

app.post("/api/applications/:id/payment/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification details are missing",
      });
    }

    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("worker");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // Only the provider who owns the job can verify the payment
    if (String(application.job.provider) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You are not authorized to verify this payment",
      });
    }

    const payment = await Payment.findOne({
      application: application._id,
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      payment.status = "Failed";
      await payment.save();

      return res.status(400).json({
        message: "Payment signature verification failed",
      });
    }

    // Prevent duplicate processing
    if (payment.status === "Paid") {
      return res.json({
        message: "Payment already verified",
        payment,
      });
    }

    payment.status = "Paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();

    await payment.save();

    // Keep the existing application payment status in sync
    application.paymentStatus = "Paid";
    await application.save();

    res.json({
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      message: "Unable to verify payment",
    });
  }
});



app.get("/api/notifications", auth, async (req,res) => {
  res.json(await Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(50));
});

app.patch("/api/notifications/:id/read", auth, async (req,res) => {
  const n=await Notification.findOneAndUpdate({_id:req.params.id,user:req.user._id},{read:true},{new:true});
  if(!n) return res.status(404).json({message:"Notification not found"});
  res.json(n);
});
// ==================== MESSAGING ====================

// Get conversation list
app.get("/api/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    }).sort({ createdAt: -1 });

    const conversations = [];

    for (const message of messages) {
      const otherUserId =
        String(message.sender) === String(req.user._id)
          ? message.receiver
          : message.sender;

      const alreadyExists = conversations.some(
        (conversation) =>
          String(conversation.userId) === String(otherUserId)
      );

      if (!alreadyExists) {
        conversations.push({
          userId: otherUserId,
          lastMessage: message.text,
          lastMessageAt: message.createdAt,
        });
      }
    }

    const userIds = conversations.map(
      (conversation) => conversation.userId
    );

    const users = await User.find({
      _id: { $in: userIds },
    }).select("name role profilePhoto verified rating");

    const result = conversations
      .map((conversation) => {
        const user = users.find(
          (item) =>
            String(item._id) === String(conversation.userId)
        );

        if (!user) return null;

        return {
          ...user.toObject(),
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (e) {
    console.error("Load conversations error:", e);

    res.status(500).json({
      message: "Failed to load conversations",
    });
  }
});


// Get messages with a specific user
app.get("/api/messages/:userId", auth, async (req, res) => {
  try {
    if (!validId(req.params.userId)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: req.user._id,
          receiver: req.params.userId,
        },
        {
          sender: req.params.userId,
          receiver: req.user._id,
        },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (e) {
    console.error("Load messages error:", e);

    res.status(500).json({
      message: "Failed to load messages",
    });
  }
});


// Send a message
app.post("/api/messages", auth, async (req, res) => {
  try {
    const { receiver, text, job } = req.body;

    if (!receiver || !text || !text.trim()) {
      return res.status(400).json({
        message: "Receiver and message are required",
      });
    }

    if (!validId(receiver)) {
      return res.status(400).json({
        message: "Invalid receiver id",
      });
    }

    const user = await User.findById(receiver);

    if (!user) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const msg = await Message.create({
      sender: req.user._id,
      receiver,
      text: text.trim(),
      job,
    });

    await Notification.create({
      user: receiver,
      title: "New message",
      message: `${req.user.name} sent you a message.`,
      type: "message",
    });

    res.status(201).json(msg);
  } catch (e) {
    console.error("Send message error:", e);

    res.status(500).json({
      message: "Failed to send message",
    });
  }
});

app.post("/api/reviews", auth, async (req,res) => {
  try {
    const {jobId,reviewee,rating,comment}=req.body;
    if(!validId(jobId) || !validId(reviewee)) return res.status(400).json({message:"Invalid id"});
    const numericRating=Number(rating);
    if(!Number.isFinite(numericRating) || numericRating<1 || numericRating>5) return res.status(400).json({message:"Rating must be between 1 and 5"});
    const job=await Job.findById(jobId);
    if(!job) return res.status(404).json({message:"Job not found"});
    const reviewTarget=await User.findById(reviewee);
    if(!reviewTarget) return res.status(404).json({message:"Reviewee not found"});
    const review=await Review.create({job:jobId,reviewer:req.user._id,reviewee,rating:numericRating,comment});
    const reviews=await Review.find({reviewee});
    reviewTarget.reviewCount=reviews.length;
    reviewTarget.rating=reviews.reduce((a,r)=>a+r.rating,0)/reviews.length;
    await reviewTarget.save();
    res.status(201).json(review);
  } catch(e) { res.status(400).json({message:e.message}); }
});
// Get public reviews for a user
app.get("/api/users/:id/reviews", auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const reviews = await Review.find({ reviewee: req.params.id })
      .populate("reviewer", "name profilePhoto role")
      .populate("job", "title date")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));