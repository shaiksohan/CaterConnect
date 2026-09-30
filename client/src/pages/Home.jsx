import "./Home.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import { api } from "../api";

const fallback=[
 {_id:"demo-1",title:"Wedding Catering",type:"Wedding",location:"Amalapuram",date:"12 October 2026",startTime:"5:00 PM",endTime:"11:00 PM",payment:800,workersNeeded:10,workersFilled:0,description:"Wedding event catering support."},
 {_id:"demo-2",title:"Birthday Event",type:"Party",location:"Razole",date:"13 October 2026",startTime:"6:00 PM",endTime:"10:00 PM",payment:600,workersNeeded:5,workersFilled:0,description:"Birthday event serving."}
];

export default function Home(){
 const [jobs,setJobs]=useState(fallback);
 useEffect(()=>{api("/jobs").then(setJobs).catch(()=>setJobs(fallback));},[]);
 return <><Navbar/><main>
  <section className="hero"><div><div className="eyebrow">CATERING WORK, MADE SIMPLE</div><h1>Find catering work.<br/><span>Work when you want.</span></h1><p className="lead">CaterConnect connects catering providers with reliable part-time workers for weddings, parties, functions and events.</p><div className="actions"><Link className="btn" to="/jobs">Find Jobs</Link><Link className="btn ghost" to="/login">Post a Job</Link></div></div><div className="heroCard"><div className="heroIcon">🍽️</div><h3>One place for event work</h3><strong>₹600–₹1,500+</strong><p>See payment, time, location and requirements before you apply.</p><Link to="/jobs">Browse available jobs →</Link></div></section>
  <section className="section"><div className="row"><div><div className="eyebrow">AVAILABLE OPPORTUNITIES</div><h2>Latest jobs</h2></div><Link to="/jobs">View all →</Link></div><div className="joblist homeJobs">{jobs.slice(0,3).map(j=><JobCard key={j._id} job={j}/>)}</div></section>
  <section className="features"><div className="card"><h3>🔎 Clear job details</h3><p>Know the payment, timing, location and requirements before applying.</p></div><div className="card"><h3>🛡️ Trust features</h3><p>Provider verification, ratings and application status help reduce uncertainty.</p></div><div className="card"><h3>📱 Simple workflow</h3><p>Browse, apply, get accepted and manage your work from one place.</p></div><div className="card"><h3>🔔 Notifications</h3><p>Get updates when applications are accepted, rejected or changed.</p></div></section>
 </main></>;
}
