import "./JobCard.css";
import { Link } from "react-router-dom";

export default function JobCard({job}){
  return <article className="job card">
    <div className="jobicon">🍽️</div>
    <div className="grow">
      <div className="row topRow"><span className="tag">{job.type||"General"}</span><strong className="pay">₹{job.payment}</strong></div>
      <h2>{job.title}</h2>
      <p>📍 {job.location} · 📅 {job.date}</p>
      <p>🕐 {job.startTime} – {job.endTime} · 👥 {Math.max(0,(job.workersNeeded||0)-(job.workersFilled||0))} spots left</p>
      <p className="muted">{job.description||"Catering support required."}</p>
      <Link className="btn small" to={`/jobs/${job._id}`}>View Details</Link>
    </div>
  </article>;
}
