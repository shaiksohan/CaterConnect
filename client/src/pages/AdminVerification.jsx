import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api";
import "./AdminVerification.css";

export default function AdminVerification() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api("/admin/verifications");

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateVerification = async (id, status) => {
    const action =
      status === "Approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this verification request?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(id);
      setMessage("");
      setError("");

      await api(`/admin/verifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      });

      setMessage(
        status === "Approved"
          ? "User verification approved successfully."
          : "User verification rejected successfully."
      );

      setUsers((current) =>
        current.filter((user) => user._id !== id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId("");
    }
  };

  return (
    <>
      <Navbar />

      <main className="admin-verification-page">
        <div className="admin-verification-container">
          <div className="admin-verification-header">
            <div>
              <h1>Verification Requests</h1>

              <p>
                Review users who have requested account
                verification.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadRequests}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>

          {message && (
            <div className="admin-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="admin-message error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="admin-empty">
              Loading verification requests...
            </div>
          ) : users.length === 0 ? (
            <div className="admin-empty">
              <h2>No pending requests</h2>

              <p>
                There are currently no users waiting for
                verification.
              </p>
            </div>
          ) : (
            <div className="verification-list">
              {users.map((user) => (
                <div
                  className="verification-card"
                  key={user._id}
                >
                  <div className="verification-main">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="verification-photo"
                      />
                    ) : (
                      <div className="verification-placeholder">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}

                    <div className="verification-info">
                      <h2>{user.name}</h2>

                      <p className="verification-role">
                        {user.role}
                      </p>

                      <p>
                        📧 {user.email}
                      </p>

                      {user.phone && (
                        <p>
                          📱 {user.phone}
                        </p>
                      )}

                      {user.location && (
                        <p>
                          📍 {user.location}
                        </p>
                      )}

                      {user.experience && (
                        <p>
                          💼 {user.experience}
                        </p>
                      )}

                      {user.skills?.length > 0 && (
                        <div className="skills-list">
                          {user.skills.map(
                            (skill, index) => (
                              <span key={index}>
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {user.bio && (
                    <div className="verification-bio">
                      <strong>Bio</strong>
                      <p>{user.bio}</p>
                    </div>
                  )}

                  <div className="verification-actions">
                    <button
                      className="approve-button"
                      onClick={() =>
                        updateVerification(
                          user._id,
                          "Approved"
                        )
                      }
                      disabled={processingId === user._id}
                    >
                      {processingId === user._id
                        ? "Processing..."
                        : "✓ Approve"}
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        updateVerification(
                          user._id,
                          "Rejected"
                        )
                      }
                      disabled={processingId === user._id}
                    >
                      {processingId === user._id
                        ? "Processing..."
                        : "✕ Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}