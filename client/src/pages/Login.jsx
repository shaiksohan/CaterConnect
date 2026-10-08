import "./Login.css";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { api } from "../api";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("worker@demo.com");
  const [password, setPassword] = useState("demo123");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const finishLogin = (data) => {
    localStorage.setItem("cc_token", data.token);
    localStorage.setItem("cc_user", JSON.stringify(data.user));
    nav(loc.state?.from || "/dashboard");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      finishLogin(data);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const googleSuccess = async (response) => {
    setBusy(true);
    setMsg("");

    try {
      const data = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          credential: response.credential,
          role: "worker",
        }),
      });

      finishLogin(data);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const googleError = () => {
    setMsg("Google login failed. Please try again.");
  };

  return (
    <>
      <Navbar />

      <main className="formPage">
        <form className="card form" onSubmit={submit}>
          <div className="eyebrow">WELCOME BACK</div>

          <h1>Login</h1>

          <p className="muted">
            Demo worker: worker@demo.com / demo123
            <br />
            Demo provider: provider@demo.com / demo123
          </p>

          {msg && <div className="notice error">{msg}</div>}

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="btn full" disabled={busy}>
            {busy ? "Logging in…" : "Login"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0",
              color: "#98a2b3",
              fontSize: "12px",
            }}
          >
            <span style={{ flex: 1, height: "1px", background: "#e4eaf2" }} />
            OR
            <span style={{ flex: 1, height: "1px", background: "#e4eaf2" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={googleSuccess}
              onError={googleError}
              useOneTap={false}
            />
          </div>

          <p className="center">
            Need an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </main>
    </>
  );
}