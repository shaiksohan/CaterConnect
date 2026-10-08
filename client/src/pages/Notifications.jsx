import "./Notifications.css";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../api";

function getIcon(type) {
  if (type === "message") return "💬";
  if (type === "application") return "📋";
  if (type === "review") return "⭐";
  if (type === "payment") return "💰";
  return "🔔";
}

function List() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    setErr("");

    api("/notifications")
      .then(setItems)
      .catch((e) => setErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const mark = async (id) => {
    try {
      await api(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      setItems((x) =>
        x.map((n) =>
          n._id === id ? { ...n, read: true } : n
        )
      );
    } catch (e) {
      setErr(e.message);
    }
  };

  const markAll = async () => {
    const unread = items.filter((n) => !n.read);

    if (!unread.length) return;

    setMarkingAll(true);
    setErr("");

    try {
      await Promise.all(
        unread.map((n) =>
          api(`/notifications/${n._id}/read`, {
            method: "PATCH",
          })
        )
      );

      setItems((current) =>
        current.map((n) => ({
          ...n,
          read: true,
        }))
      );
    } catch (e) {
      setErr(e.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <>
      <Navbar />

      <main className="section notifications-page">
        <div className="notifications-header">
          <div>
            <div className="eyebrow">UPDATES</div>

            <h1>Notifications</h1>

            <p className="muted">
              {unreadCount
                ? `${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "You're all caught up."}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              className="btn small"
              onClick={markAll}
              disabled={markingAll}
            >
              {markingAll
                ? "Marking..."
                : "Mark all as read"}
            </button>
          )}
        </div>

        {err && (
          <div className="notice error">
            {err}
          </div>
        )}

        {items.length ? (
          <div className="notifications-list">
            {items.map((n) => (
              <div
                className={`card notification ${
                  n.read ? "" : "unread"
                }`}
                key={n._id}
                onClick={() => !n.read && mark(n._id)}
              >
                <div className="notification-icon">
                  {getIcon(n.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-top">
                    <h3>{n.title}</h3>

                    {!n.read && (
                      <span className="tag">
                        New
                      </span>
                    )}
                  </div>

                  <p>{n.message}</p>

                  <small className="muted">
                    {new Date(
                      n.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card empty-notifications">
            <div className="notification-empty-icon">
              🔔
            </div>

            <h3>No notifications</h3>

            <p className="muted">
              You're all caught up.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

export default function Notifications() {
  return (
    <ProtectedRoute>
      <List />
    </ProtectedRoute>
  );
}