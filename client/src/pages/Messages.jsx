import "./Messages.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../api";

function MessagesPage() {
  const { userId } = useParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("cc_user") || "null"
  );

  const loadMessages = async () => {
    try {
      const data = await api(`/messages/${userId}`);
      setMessages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const data = await api(`/users/${userId}/profile`);
      setOtherUser(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (!userId) return;

    loadMessages();
    loadUser();
  }, [userId]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    setSending(true);
    setError("");

    try {
      const newMessage = await api("/messages", {
        method: "POST",
        body: JSON.stringify({
          receiver: userId,
          text: text.trim(),
        }),
      });

      setMessages((prev) => [...prev, newMessage]);
      setText("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="section messages-page">
        <Link to="/dashboard">← Dashboard</Link>

        <div className="messages-header">
          <div>
            <h1>Messages</h1>

            {otherUser && (
              <p>
                Chatting with{" "}
                <strong>{otherUser.name}</strong>
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}

        <div className="messages-card">
          <div className="messages-list">
            {loading ? (
              <p className="muted">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="empty-messages">
                <h3>No messages yet</h3>
                <p>Start the conversation.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine =
                  String(message.sender) ===
                  String(currentUser?._id);

                return (
                  <div
                    key={message._id}
                    className={`message-row ${
                      isMine ? "mine" : "theirs"
                    }`}
                  >
                    <div className="message-bubble">
                      <p>{message.text}</p>

                      <small>
                        {new Date(
                          message.createdAt
                        ).toLocaleString()}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="message-form"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />

            <button
              className="btn"
              type="submit"
              disabled={sending || !text.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

export default function Messages() {
  return (
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  );
}