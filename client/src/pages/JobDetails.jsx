import "./JobDetails.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api";

const demo = {
  _id: "demo-1",
  title: "Wedding Catering",
  type: "Wedding",
  description: "Wedding event catering support.",
  location: "Amalapuram",
  date: "12 October 2026",
  startTime: "5:00 PM",
  endTime: "11:00 PM",
  payment: 800,
  workersNeeded: 10,
  workersFilled: 0,
  requirements: ["Punctual", "Serving"],
  provider: {
    name: "Sri Lakshmi Catering",
    verified: true,
    rating: 4.6,
    reviewCount: 18,
  },
};

function isJobExpired(job) {
  if (!job?.date || !job?.endTime) {
    return false;
  }

  const end = new Date(`${job.date}T${job.endTime}`);

  if (Number.isNaN(end.getTime())) {
    return false;
  }

  return new Date() >= end;
}

function isJobFull(job) {
  return (
    Number(job?.workersFilled || 0) >=
    Number(job?.workersNeeded || 0)
  );
}

export default function JobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(
    id?.startsWith("demo-") ? demo : null
  );

  const [loading, setLoading] = useState(
    !id?.startsWith("demo-")
  );

  const [error, setError] = useState("");

  useEffect(() => {
    if (id?.startsWith("demo-")) return;

    api(`/jobs/${id}`)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="section">
          <div className="card">
            Loading job…
          </div>
        </main>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <Navbar />

        <main className="section">
          <div className="card">
            <h2>Job not found</h2>

            <p>
              {error || "This job does not exist."}
            </p>

            <Link to="/jobs">
              Back to jobs
            </Link>
          </div>
        </main>
      </>
    );
  }

  const expired = isJobExpired(job);
  const full = isJobFull(job);
  const unavailable =
    expired ||
    full ||
    job.status !== "Open";

  return (
    <>
      <Navbar />

      <main className="section">
        <Link to="/jobs">
          ← Back to jobs
        </Link>

        <div className="detail">
          <section>
            <div className="eyebrow">
              {job.type}
            </div>

            <h1>{job.title}</h1>

            <p className="lead">
              {job.description}
            </p>

            <div className="infoGrid">
              <div>
                📍
                <b>Location</b>
                <span>{job.location}</span>
              </div>

              <div>
                📅
                <b>Date</b>
                <span>{job.date}</span>
              </div>

              <div>
                🕐
                <b>Time</b>
                <span>
                  {job.startTime} – {job.endTime}
                </span>
              </div>

              <div>
  👥
  <b>Workers</b>

  <span>
    {job.workersFilled || 0}/
    {job.workersNeeded} filled
  </span>

  <span>
    {Math.max(
      0,
      (job.workersNeeded || 0) -
        (job.workersFilled || 0)
    ) > 0
      ? `🟢 ${Math.max(
          0,
          (job.workersNeeded || 0) -
            (job.workersFilled || 0)
        )} spots remaining`
      : "🔴 No spots remaining"}
  </span>
</div>
            </div>

            {unavailable && (
              <div className="notice error">
                <strong>
                  This job is no longer available.
                </strong>

                <p>
                  {expired
                    ? "The event has already ended."
                    : full
                    ? "The required number of workers has already been accepted."
                    : `This job is ${String(
                        job.status || ""
                      ).toLowerCase()}.`}
                </p>
              </div>
            )}

            <div className="card inner">
              <h2>Requirements</h2>

              {(job.requirements || []).length ? (
                <ul>
                  {job.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  No special requirements listed.
                </p>
              )}

              <h2>Safety & trust</h2>

              <p>
                Review provider information and job
                details before applying. Use
                in-app reporting/dispute features
                when available.
              </p>
            </div>
          </section>

          <aside className="card sticky">
            <div className="muted">
              Payment
            </div>

            <div className="bigpay">
              ₹{job.payment}
            </div>

            <p>for the listed event</p>

            <hr />

            <h3>Provider</h3>

            {job.provider?._id ? (
              <Link
                className="provider-profile-link"
                to={`/users/${job.provider._id}/profile`}
              >
                <strong>
                  {job.provider.name || "Provider"}
                </strong>
              </Link>
            ) : (
              <p>
                <strong>
                  {job.provider?.name || "Provider"}
                </strong>
              </p>
            )}

            {job.provider?.verified && (
              <p className="verified">
                ✓ Verified provider
              </p>
            )}

            {job.provider?.rating > 0 && (
              <p>
                ⭐{" "}
                {Number(job.provider.rating).toFixed(1)}
                {" "}
                ({job.provider.reviewCount || 0} reviews)
              </p>
            )}

            {unavailable ? (
              <button
                className="btn full"
                disabled
              >
                Job Unavailable
              </button>
            ) : (
              <Link
                className="btn full"
                to={
                  id?.startsWith("demo-")
                    ? "/login"
                    : `/jobs/${id}/apply`
                }
              >
                Apply Now
              </Link>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}