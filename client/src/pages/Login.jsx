import "./Login.css";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { api } from "../api";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();

  const [role, setRole] = useState("worker");
  const [mode, setMode] = useState("login");
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
        body: JSON.stringify({ email, password, role }),
      });

      if (data.user?.role && data.user.role.toLowerCase() !== role) {
        setMsg(`This account is registered as a ${data.user.role}. Please select the correct role.`);
        return;
      }

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
          role,
        }),
      });

      if (data.user?.role && data.user.role.toLowerCase() !== role) {
        setMsg(`This Google account is registered as a ${data.user.role}. Please select the correct role.`);
        return;
      }

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

  const changeRole = (newRole) => {
    setRole(newRole);
    setEmail(newRole === "worker" ? "worker@demo.com" : "provider@demo.com");
    setPassword("demo123");
    setMsg("");
  };

  return (
    <>
      <Navbar />

      <main className="formPage">
        <form className="card form" onSubmit={submit}>
          <div className="eyebrow">WELCOME TO CATERCONNECT</div>

          <h1>{mode === "login" ? "Welcome Back!" : "Create Account"}</h1>
          
          <p className="muted">
            {mode === "login"
              ? "Login to find catering work or manage your catering jobs."
              : "Join CaterConnect as a worker or catering provider."}
          </p>

          {/* Role selection */}
          <div className="auth-section">
            <span className="auth-label">I want to join as</span>

            <div className="auth-toggle">
              <button
                type="button"
                className={role === "worker" ? "active" : ""}
                onClick={() => changeRole("worker")}
              >
                👷 Worker
              </button>

              <button
                type="button"
                className={role === "provider" ? "active" : ""}
                onClick={() => changeRole("provider")}
              >
                🍽️ Provider
              </button>
            </div>
          </div>

          

          {msg && <div className="notice error">{msg}</div>}

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>

          <button className="btn full" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Register"}
          </button>

          <div className="auth-divider">
            <span />
            OR CONTINUE WITH
            <span />
          </div>

          <div className="google-login">
            <GoogleLogin
              onSuccess={googleSuccess}
              onError={googleError}
              useOneTap={false}
            />
          </div>

          <p className="center">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link to="/register" state={{ role }}>
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </form>
      </main>
    </>
  );
}