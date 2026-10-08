import "./ProviderJob.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api, loadRazorpay } from "../api";

function Manage() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reviewApp, setReviewApp] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [paying, setPaying] = useState(false);
  const load = async () => {
    try {
      const [jobData, applications] = await Promise.all([
        api(`/jobs/${id}`),
        api(`/jobs/${id}/applications`),
      ]);

      setJob(jobData);
      setApps(applications);
    } catch (e) {
      setMsg(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);
  const cancelJob = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this job? All applicants will be notified."
  );

  if (!confirmed) {
    return;
  }

  setCancelling(true);
  setMsg("");

  try {
    await api(`/jobs/${id}/cancel`, {
      method: "PATCH",
    });

    await load();
    setMsg("Job cancelled successfully.");
  } catch (e) {
    setMsg(e.message);
  } finally {
    setCancelling(false);
  }
};
  const update = async (appId, status) => {
    setMsg("");

    try {
      await api(`/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await load();
    } catch (e) {
      setMsg(e.message);
    }
  };

 const markPaid = async (appId) => {
  const confirmed = window.confirm(
    "Are you sure you want to mark this worker's payment as paid?"
  );

  if (!confirmed) {
    return;
  }

  setPaying(true);
  setMsg("");

  try {
    await api(`/applications/${appId}/payment`, {
      method: "PATCH",
    });

    await load();

    setMsg("Payment marked as paid successfully.");
  } catch (e) {
    setMsg(e.message);
  } finally {
    setPaying(false);
  }
};
const payWorker = async (app) => {
  try {
    setPaying(true);
    setMsg("");

    const loaded = await loadRazorpay();

    if (!loaded) {
      throw new Error("Razorpay failed to load.");
    }

    const order = await api(`/applications/${app._id}/payment/order`, {
      method: "POST",
    });

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: "CaterConnect",
      description: `Payment for ${job?.title || "completed work"}`,
      order_id: order.orderId,

      handler: async function (response) {
        try {
          await api(`/applications/${app._id}/payment/verify`, {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          await load();
          setMsg("Payment completed successfully.");
        } catch (e) {
          setMsg(e.message);
        } finally {
          setPaying(false);
        }
      },

      modal: {
        ondismiss: function () {
          setPaying(false);
          setMsg("Payment cancelled.");
        },
      },

      theme: {
        color: "#7654d8",
      },
    };

    const razorpayCheckout = new window.Razorpay(options);

    razorpayCheckout.on("payment.failed", function (response) {
      setPaying(false);
      setMsg(
        response.error?.description || "Payment failed. Please try again."
      );
    });

    razorpayCheckout.open();
  } catch (e) {
    setPaying(false);
    setMsg(e.message);
  }
};

const submitReview = async () => {
  if (!reviewApp?.worker?._id) {
    setReviewMsg("Worker information is missing.");
    return;
  }

  setSubmitting(true);
  setReviewMsg("");

  try {
    await api("/reviews", {
      method: "POST",
      body: JSON.stringify({
        jobId: id,
        reviewee: reviewApp.worker._id,
        rating: Number(rating),
        comment: comment.trim(),
      }),
    });

    setReviewMsg("Review submitted successfully!");

    setTimeout(() => {
      setReviewApp(null);
      setReviewMsg("");
      setComment("");
    }, 1200);
  } catch (e) {
    setReviewMsg(e.message);
  } finally {
    setSubmitting(false);
  }
};

  const workersNeeded = Number(
    job?.workersNeeded || 0
  );

  const workersFilled = Number(
    job?.workersFilled || 0
  );

  const spotsLeft = Math.max(
    0,
    workersNeeded - workersFilled
  );

  return (
    <>
      <Navbar />

      <main className="section">
        <Link to="/dashboard">
          ← Dashboard
        </Link>

        <h1>Manage Applicants</h1>

        {msg && (
          <div className="notice error">
            {msg}
          </div>
        )}

        {job && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h2>{job.title}</h2>

            <p className="muted">
              {job.date} · {job.startTime} – {job.endTime}
            </p>
            {job.status === "Cancelled" && (
  <p style={{ marginTop: "12px", fontWeight: "600" }}>
    🔴 Job Cancelled
  </p>
)}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <div className="card">
                <strong>Workers Needed</strong>
                <h2>{workersNeeded}</h2>
              </div>

              <div className="card">
                <strong>Accepted</strong>
                <h2>{workersFilled}</h2>
              </div>

              <div className="card">
                <strong>Spots Remaining</strong>
                <h2>
                  {spotsLeft}
                </h2>
              </div>

              <div className="card">
                <strong>Applications</strong>
                <h2>{apps.length}</h2>
              </div>
            </div>

            {spotsLeft > 0 ? (
              <p style={{ marginTop: "14px" }}>
                🟢 <strong>{spotsLeft}</strong>{" "}
                spot{spotsLeft !== 1 ? "s" : ""} remaining.
                You can accept applicants until all
                positions are filled.
              </p>
            ) : (
              <p
                style={{
                  marginTop: "14px",
                  fontWeight: "600",
                }}
              >
                🔴 All worker positions are filled.
              </p>
            )}
                  {job.status !== "Cancelled" && job.status !== "Completed" && (
  <div className="actions" style={{ marginTop: "16px" }}>
    <button
      className="btn danger"
      onClick={cancelJob}
      disabled={cancelling}
    >
      {cancelling ? "Cancelling..." : "Cancel Job"}
    </button>
  </div>
)} 
          </div>
        )}

        {apps.length ? (
          apps.map((a) => (
            <div className="card" key={a._id}>
              <div className="row">
                <div>
                  <h3>{a.worker?.name}</h3>

                  <p>
                    {a.worker?.phone || "No phone"} ·{" "}
                    {a.worker?.email}
                  </p>
                </div>

                <span className="tag">
                  {a.status}
                </span>
              </div>

              <p>
                {a.experience ||
                  "No experience details"}
              </p>

              <p>
                {a.message || "No message"}
              </p>

              <Link
                className="btn small"
                to={`/users/${a.worker?._id}/profile`}
              >
                View Profile
              </Link>

              {a.status === "Pending" && (
                <div className="actions">
                  <button
                    className="btn"
                    onClick={() =>
                      update(a._id, "Accepted")
                    }
                    disabled={spotsLeft <= 0}
                  >
                    {spotsLeft > 0
                      ? "Accept"
                      : "No Spots Available"}
                  </button>

                  <button
                    className="btn danger"
                    onClick={() =>
                      update(a._id, "Rejected")
                    }
                  >
                    Reject
                  </button>
                </div>
              )}

              {a.status === "Accepted" && (
                <div className="actions">
                  <button
                    className="btn"
                    onClick={() =>
                      update(a._id, "Completed")
                    }
                  >
                    Mark Completed
                  </button>
                </div>
              )}
        {a.status === "Completed" && (
  <div className="actions">
    <p className="success-message">
      ✓ Work completed
    </p>

    {/* Payment Information */}
    <div
      className="card"
      style={{
        marginTop: "14px",
        marginBottom: "14px",
      }}
    >
      <h3>Payment</h3>

      <p>
        Amount:{" "}
        <strong>
          ₹{a.paymentAmount || 0}
        </strong>
      </p>

      <p>
        Status:{" "}
        <strong>
          {a.paymentStatus || "Pending"}
        </strong>
      </p>

      {a.paymentStatus === "Paid" ? (
        <>
          <p className="success-message">
            ✓ Payment completed
          </p>

          {a.transactionId && (
            <p>
              Transaction ID:{" "}
              <strong>{a.transactionId}</strong>
            </p>
          )}

          {a.paidAt && (
            <p>
              Paid At:{" "}
              {new Date(a.paidAt).toLocaleString()}
            </p>
          )}
        </>
      ) : (
        <button
  className="btn"
  onClick={() => payWorker(a)}
  disabled={paying}
>
  {paying ? "Processing..." : `💳 Pay ₹${a.paymentAmount || job?.payment || 0}`}
</button>
      )}
    </div>

    <button
      className="btn"
      onClick={() => {
        setReviewApp(a);
        setRating(5);
        setComment("");
        setReviewMsg("");
      }}
    >
      Review Worker
    </button>
  </div>
)}
             
              {reviewApp?._id === a._id && (
                <div
                  className="card"
                  style={{ marginTop: "16px" }}
                >
                  <h3>Review Worker</h3>

                  <p>
                    Worker:{" "}
                    <strong>
                      {a.worker?.name || "Worker"}
                    </strong>
                  </p>

                  <label>Rating</label>

                  <select
                    value={rating}
                    onChange={(e) =>
                      setRating(
                        Number(e.target.value)
                      )
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px",
                      marginTop: "6px",
                      marginBottom: "14px",
                    }}
                  >
                    <option value={5}>
                      ⭐⭐⭐⭐⭐ 5 - Excellent
                    </option>
                    <option value={4}>
                      ⭐⭐⭐⭐ 4 - Good
                    </option>
                    <option value={3}>
                      ⭐⭐⭐ 3 - Average
                    </option>
                    <option value={2}>
                      ⭐⭐ 2 - Poor
                    </option>
                    <option value={1}>
                      ⭐ 1 - Very Poor
                    </option>
                  </select>

                  <label>Comment</label>

                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    placeholder="Write your experience with this worker..."
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
                      {submitting
                        ? "Submitting..."
                        : "Submit Review"}
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
          ))
        ) : (
          <div className="card">
            No applicants yet.
          </div>
        )}
      </main>
    </>
  );
}

export default function ProviderJob() {
  return (
    <ProtectedRoute role="provider">
      <Manage />
    </ProtectedRoute>
  );
}