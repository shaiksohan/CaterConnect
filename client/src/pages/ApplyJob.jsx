import "./ApplyJob.css";
import { useParams,useNavigate,Link } from "react-router-dom";
import { useEffect,useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../api";

function ApplyForm(){const {id}=useParams(),nav=useNavigate();const [job,setJob]=useState(null),[f,setF]=useState({experience:"",message:""}),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);useEffect(()=>{if(id?.startsWith("demo-")){setJob({title:"Demo job",payment:800,location:"Demo location"});return;}api(`/jobs/${id}`).then(setJob).catch(e=>setMsg(e.message));},[id]);const submit=async e=>{e.preventDefault();setBusy(true);setMsg("");try{await api("/applications",{method:"POST",body:JSON.stringify({jobId:id,...f})});nav("/dashboard");}catch(e){setMsg(e.message);}finally{setBusy(false);}};return <><Navbar/><main className="formPage"><Link to={`/jobs/${id}`}>← Back to job</Link><form className="card form" onSubmit={submit}><h1>Apply for {job?.title||"this job"}</h1>{job&&<p className="muted">{job.location} · ₹{job.payment}</p>}{msg&&<div className="notice error">{msg}</div>}<label>Experience<textarea required value={f.experience} onChange={e=>setF({...f,experience:e.target.value})} placeholder="Tell the provider about your catering/event experience"/></label><label>Message<textarea value={f.message} onChange={e=>setF({...f,message:e.target.value})} placeholder="Availability, skills or anything else"/></label><button className="btn full" disabled={busy||id?.startsWith("demo-")}>{busy?"Submitting…":id?.startsWith("demo-")?"Connect database to apply":"Submit Application"}</button></form></main></>}
export default function ApplyJob(){return <ProtectedRoute role="worker"><ApplyForm/></ProtectedRoute>}
