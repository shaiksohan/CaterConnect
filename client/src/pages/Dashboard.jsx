import "./Dashboard.css";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../api";
import { Link } from "react-router-dom";

function Worker() {
  const [apps, setApps] = useState([]);
  const [err, setErr] = useState("");

  const [reviewApp, setReviewApp] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = () => {
    api("/my/applications")
      .then(setApps)
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const submitReview = async () => {
    if (!reviewApp?.job?._id || !reviewApp?.job?.provider?._id) {
      setReviewMsg("Provider information is missing.");
      return;
    }

    setSubmitting(true);
    setReviewMsg("");

    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({
          jobId: reviewApp.job._id,
          reviewee: reviewApp.job.provider._id,
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });

      setReviewMsg("Review submitted successfully!");
      setComment("");

      setTimeout(() => {
        setReviewApp(null);
        setReviewMsg("");
      }, 1200);
    } catch (e) {
      setReviewMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="section">
        <div className="row">
          <div>
            <div className="eyebrow">WORKER</div>
            <h1>My Dashboard</h1>
          </div>

          <Link className="btn" to="/jobs">
            Find More Jobs
          </Link>
        </div>

        {err && <div className="notice">{err}</div>}

        <h2>Applications</h2>

        {apps.length ? (
          <div className="stack">
            {apps.map((a) => (
              <div className="card" key={a._id}>
                <div className="row">
  <h3>{a.job?.title}</h3>

  {a.job?.status === "Cancelled" ? (
    <span className="tag">
      Cancelled
    </span>
  ) : (
    <span className="tag">
      {a.status}
    </span>
  )}
</div>

                <p>
                  📍 {a.job?.location} · ₹{a.job?.payment}
                </p>
                {a.job?.status === "Cancelled" && (
  <p
    style={{
      marginTop: "8px",
      fontWeight: "600",
    }}
  >
    🔴 This job was cancelled by the provider.
  </p>
)}
                <p className="muted">
                  Applied {new Date(a.createdAt).toLocaleString()}
                </p>

                {a.status === "Completed" && (
                  <div className="actions">
                    <p className="success-message">
                      ✓ Work completed
                    </p>

                    <button
                      className="btn"
                      onClick={() => {
                        setReviewApp(a);
                        setRating(5);
                        setComment("");
                        setReviewMsg("");
                      }}
                    >
                      Leave Review
                    </button>
                  </div>
                )}

                {reviewApp?._id === a._id && (
                  <div className="card" style={{ marginTop: "16px" }}>
                    <h3>Review Provider</h3>

                    <p>
                      Provider:{" "}
                      <strong>
                        {a.job?.provider?.name || "Provider"}
                      </strong>
                    </p>

                    <label>
                      Rating
                    </label>

                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px",
                        marginTop: "6px",
                        marginBottom: "14px",
                      }}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
                      <option value={4}>⭐⭐⭐⭐ 4 - Good</option>
                      <option value={3}>⭐⭐⭐ 3 - Average</option>
                      <option value={2}>⭐⭐ 2 - Poor</option>
                      <option value={1}>⭐ 1 - Very Poor</option>
                    </select>

                    <label>
                      Comment
                    </label>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your experience with this provider..."
                      rows="4"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px",
                        marginTop: "6px",
                        marginBottom: "14px",
                        resize: "vertical",
                      }}
                    />

                    {reviewMsg && (
                      <div className="notice">
                        {reviewMsg}
                      </div>
                    )}

                    <div className="actions">
                      <button
                        className="btn"
                        onClick={submitReview}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                      </button>

                      <button
                        className="btn danger"
                        onClick={() => {
                          setReviewApp(null);
                          setReviewMsg("");
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p>No applications yet.</p>
            <Link to="/jobs">Browse jobs</Link>
          </div>
        )}
      </main>
    </>
  );
}

function Provider() {
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");

  const load = () =>
    api("/provider/jobs")
      .then(setJobs)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Navbar />

      <main className="section">
        <div className="row">
          <div>
            <div className="eyebrow">PROVIDER</div>
            <h1>Provider Dashboard</h1>
          </div>

          <Link className="btn" to="/post-job">
            Post New Job
          </Link>
        </div>

        {err && <div className="notice">{err}</div>}

        {jobs.length ? (
          <div className="stack">
            {jobs.map((j) => (
              <div className="card" key={j._id}>
                <div className="row">
                  <h2>{j.title}</h2>
                  <span className="tag">{j.status}</span>
                </div>

                <p>
                  📍 {j.location} · ₹{j.payment} · 👥{" "}
                  {j.workersFilled}/{j.workersNeeded}
                </p>

                <Link
                  className="btn small"
                  to={`/provider/jobs/${j._id}`}
                >
                  Manage Applicants
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p>No jobs posted yet.</p>
            <Link to="/post-job">Post your first job</Link>
          </div>
        )}
      </main>
    </>
  );
}

export default function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("cc_user") || "null"
  );

  return (
    <ProtectedRoute>
      {user?.role === "provider" ? <Provider /> : <Worker />}
    </ProtectedRoute>
  );
}