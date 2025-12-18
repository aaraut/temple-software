import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "./Header.css";

export default function Header() {
  const { auth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!auth) return null;

  const isAdmin =
    auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  return (
    <header className="app-header">
      <div className="logo" onClick={() => navigate("/")}>
        🛕 Temple App
      </div>

      <nav className="menu">
        <Link to="/">Home</Link>
        <Link to="/gotra">Gotra</Link>
        {isAdmin && <Link to="/users">Users</Link>}
      </nav>

      <div className="profile">
        <span onClick={() => setOpen(!open)}>
          👤 {auth.username} ▾
        </span>

        {open && (
          <div className="dropdown">
            <div onClick={() => navigate("/change-password")}>
              Change Password
            </div>
            <div onClick={logout} className="logout">
              Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
