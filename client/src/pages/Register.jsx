import "./Register.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "../components/Navbar";
import { api } from "../api";

export default function Register() {
  const nav = useNavigate();

  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "worker",
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const finishLogin = (data) => {
    localStorage.setItem("cc_token", data.token);
    localStorage.setItem("cc_user", JSON.stringify(data.user));
    nav("/dashboard");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const d = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(f),
      });

      finishLogin(d);
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
      const d = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          credential: response.credential,
          role: f.role,
        }),
      });

      finishLogin(d);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const googleError = () => {
    setMsg("Google registration failed. Please try again.");
  };

  return (
    <>
      <Navbar />

      <main className="formPage">
        <form className="card form" onSubmit={submit}>
          <div className="eyebrow">JOIN CATERCONNECT</div>

          <h1>Create account</h1>

          {msg && <div className="notice error">{msg}</div>}

          <label>
            Name
            <input
              required
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </label>

          <label>
            Email
            <input
              required
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </label>

          <label>
            Phone
            <input
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </label>

          <label>
            Account type
            <select
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
            >
              <option value="worker">Worker</option>
              <option value="provider">Catering Provider</option>
            </select>
          </label>

          <button className="btn full" disabled={busy}>
            {busy ? "Creating…" : "Create Account"}
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
            <span
              style={{
                flex: 1,
                height: "1px",
                background: "#e4eaf2",
              }}
            />
            OR
            <span
              style={{
                flex: 1,
                height: "1px",
                background: "#e4eaf2",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={googleSuccess}
              onError={googleError}
              useOneTap={false}
            />
          </div>

          <p className="center">
            Already have an account?{" "}
            <a href="/login">Login</a>
          </p>
        </form>
      </main>
    </>
  );
}