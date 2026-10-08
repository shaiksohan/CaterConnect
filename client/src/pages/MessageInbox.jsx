import "./MessageInbox.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../api";

function Inbox() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/messages")
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />

      <main className="section message-inbox">
        <div className="inbox-header">
          <h1>Messages</h1>
          <p>Chat with workers and providers.</p>
        </div>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card">
            <p>Loading conversations...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="card empty-inbox">
            <h3>No conversations yet</h3>
            <p>
              Open a worker or provider profile and
              start a conversation.
            </p>

            <Link className="btn" to="/jobs">
              Find Jobs
            </Link>
          </div>
        ) : (
          <div className="conversation-list">
            {users.map((user) => (
              <Link
                key={user._id}
                to={`/messages/${user._id}`}
                className="conversation-card"
              >
                <div className="conversation-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                <div className="conversation-info">
  <div className="conversation-top">
    <h3>{user.name}</h3>

    {user.lastMessageAt && (
      <small>
        {new Date(user.lastMessageAt).toLocaleString()}
      </small>
    )}
  </div>

  <p className="conversation-role">
    {user.role === "worker"
      ? "Catering Worker"
      : "Catering Provider"}
  </p>

  <p className="conversation-last-message">
    {user.lastMessage || "No messages yet"}
  </p>
</div>

                <span className="conversation-arrow">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function MessageInbox() {
  return (
    <ProtectedRoute>
      <Inbox />
    </ProtectedRoute>
  );
}