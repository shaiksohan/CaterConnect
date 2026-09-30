import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar(){
  const navigate=useNavigate();
  const user=JSON.parse(localStorage.getItem("cc_user")||"null");
  const logout=()=>{localStorage.removeItem("cc_token");localStorage.removeItem("cc_user");navigate("/");};
  return <header className="nav">
    <Link className="brand" to="/"><span>Cater</span>Connect</Link>
    <nav className="navlinks">
      <Link to="/jobs">Find Jobs</Link>
      {user && <Link to="/dashboard">Dashboard</Link>}
      {user && <Link to="/notifications">Notifications</Link>}
      {user?.role==="provider" && <Link className="btn small" to="/post-job">Post Job</Link>}
      {user ? <button className="navButton" onClick={logout}>Logout</button> : <Link className="btn small" to="/login">Login</Link>}
    </nav>
  </header>;
}
