const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Notification = require("./models/Notification");
const Review = require("./models/Review");
const Message = require("./models/Message");
const { auth, role } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

const mongoReady = mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err.message));

const validId = value => mongoose.isValidObjectId(value);


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

app.get("/api/me", auth, (req,res) => {
  const u=req.user;
  res.json({id:u._id,name:u.name,email:u.email,phone:u.phone,role:u.role,verified:u.verified,bio:u.bio,skills:u.skills,rating:u.rating,reviewCount:u.reviewCount});
});

app.get("/api/jobs", async (req,res) => {
  try {
    const {search,type,status="Open",location} = req.query;
    const q={};
    if(status) q.status=status;
    if(type && type!=="All") q.type=type;
    if(location) q.location={$regex:location,$options:"i"};
    if(search) q.$or=[{title:{$regex:search,$options:"i"}},{description:{$regex:search,$options:"i"}},{location:{$regex:search,$options:"i"}},{type:{$regex:search,$options:"i"}}];
    const jobs=await Job.find(q).populate("provider","name verified rating reviewCount").sort({createdAt:-1});
    res.json(jobs);
  } catch(e) { res.status(500).json({message:e.message}); }
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

app.post("/api/applications", auth, role("worker"), async (req,res) => {
  try {
    if(!validId(req.body.jobId)) return res.status(400).json({message:"Invalid job id"});
    const job=await Job.findById(req.body.jobId);
    if(!job || job.status!=="Open") return res.status(400).json({message:"This job is not open"});
    if(job.workersFilled>=job.workersNeeded) return res.status(400).json({message:"No worker slots available"});
    const existing=await Application.findOne({job:job._id,worker:req.user._id});
    if(existing) return res.status(409).json({message:"You already applied for this job"});
    const application=await Application.create({
      job:job._id,worker:req.user._id,nameSnapshot:req.user.name,phoneSnapshot:req.user.phone,
      experience:req.body.experience,message:req.body.message
    });
    await Notification.create({user:job.provider,title:"New application",message:`${req.user.name} applied for ${job.title}`,type:"application"});
    res.status(201).json(application);
  } catch(e) { res.status(400).json({message:e.message}); }
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
  if(req.body.status === "Accepted") {
    const job=await Job.findById(appItem.job._id);
    if(!job || job.status !== "Open" || job.workersFilled >= job.workersNeeded) return res.status(400).json({message:"No worker slots available"});
    job.workersFilled += 1;
    if(job.workersFilled>=job.workersNeeded) job.status="Filled";
    await job.save();
  }
  appItem.status=req.body.status;
  await appItem.save();
  await Notification.create({user:appItem.worker,title:`Application ${appItem.status}`,message:`Your application for ${appItem.job.title} is ${appItem.status.toLowerCase()}.`,type:"application"});
  res.json(appItem);
});

app.get("/api/notifications", auth, async (req,res) => {
  res.json(await Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(50));
});

app.patch("/api/notifications/:id/read", auth, async (req,res) => {
  const n=await Notification.findOneAndUpdate({_id:req.params.id,user:req.user._id},{read:true},{new:true});
  if(!n) return res.status(404).json({message:"Notification not found"});
  res.json(n);
});

app.get("/api/messages/:userId", auth, async (req,res) => {
  const messages=await Message.find({$or:[{sender:req.user._id,receiver:req.params.userId},{sender:req.params.userId,receiver:req.user._id}]}).sort({createdAt:1});
  res.json(messages);
});

app.post("/api/messages", auth, async (req,res) => {
  const {receiver,text,job}=req.body;
  if(!receiver || !text) return res.status(400).json({message:"Receiver and message are required"});
  const msg=await Message.create({sender:req.user._id,receiver,text,job});
  await Notification.create({user:receiver,title:"New message",message:`${req.user.name} sent you a message.`,type:"message"});
  res.status(201).json(msg);
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

app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));