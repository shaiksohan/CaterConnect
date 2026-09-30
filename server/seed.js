const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
require("dotenv").config();
const User=require("./models/User");
const Job=require("./models/Job");

async function run(){
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await Job.deleteMany({});
  const hash=await bcrypt.hash("demo123",10);
  const provider=await User.create({name:"Sri Lakshmi Catering",email:"provider@demo.com",passwordHash:hash,phone:"9000000001",role:"provider",verified:true,rating:4.6,reviewCount:18,bio:"Local catering provider"});
  const worker=await User.create({name:"Demo Worker",email:"worker@demo.com",passwordHash:hash,phone:"9000000002",role:"worker",verified:true,skills:["Serving","Setup"]});
  await Job.insertMany([
    {title:"Wedding Catering",type:"Wedding",description:"Wedding event catering support.",location:"Amalapuram",date:"12 October 2026",startTime:"5:00 PM",endTime:"11:00 PM",payment:800,workersNeeded:10,requirements:["Punctual","Serving"],provider:provider._id},
    {title:"Birthday Event",type:"Party",description:"Birthday event serving.",location:"Razole",date:"13 October 2026",startTime:"6:00 PM",endTime:"10:00 PM",payment:600,workersNeeded:5,requirements:["Serving"],provider:provider._id},
    {title:"Corporate Event",type:"Corporate",description:"Corporate catering support.",location:"Kakinada",date:"15 October 2026",startTime:"8:00 AM",endTime:"4:00 PM",payment:1000,workersNeeded:15,requirements:["Formal dress"],provider:provider._id}
  ]);
  console.log("Seed complete. Demo accounts: worker@demo.com / provider@demo.com password demo123");
  await mongoose.disconnect();
}
run().catch(e=>{console.error(e);process.exit(1)});