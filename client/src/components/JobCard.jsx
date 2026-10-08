import "./JobCard.css";
import { Link } from "react-router-dom";

export default function JobCard({ job }) {
  const workersNeeded = Number(job.workersNeeded || 0);
  const workersFilled = Number(job.workersFilled || 0);

  const spotsLeft = Math.max(
    0,
    workersNeeded - workersFilled
  );

  return (
    <article className="job card">
      <div className="jobicon">🍽️</div>

      <div className="grow">
        <div className="row topRow">
          <span className="tag">
            {job.type || "General"}
          </span>

          <strong className="pay">
            ₹{job.payment}
          </strong>
        </div>

        <h2>{job.title}</h2>

        <p>
          📍 {job.location} · 📅 {job.date}
        </p>

        <p>
          🕐 {job.startTime} – {job.endTime}
        </p>

        <div className="worker-status">
          <span>
            👥 {workersFilled}/{workersNeeded} filled
          </span>

          <span className="spots-left">
            {spotsLeft > 0
              ? `🟢 ${spotsLeft} spots remaining`
              : "🔴 No spots remaining"}
          </span>
        </div>

        <p className="muted">
          {job.description ||
            "Catering support required."}
        </p>

        <Link
          className="btn small"
          to={`/jobs/${job._id}`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}