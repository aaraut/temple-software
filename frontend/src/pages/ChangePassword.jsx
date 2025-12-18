import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { changePasswordApi } from "../api/authApi";

export default function ChangePassword() {
  const { auth, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }

    try {
      await changePasswordApi(
        oldPassword,
        newPassword,
        auth.token
      );
      setSuccess("Password changed successfully. Please login again.");
      setTimeout(logout, 1500);
    } catch (err) {
      setError("Failed to change password");
    }
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Change Password</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}
