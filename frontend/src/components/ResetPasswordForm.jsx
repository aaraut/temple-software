import { useState } from "react";

export default function ResetPasswordForm({ user, onSave, onCancel }) {
  const [tempPassword, setTempPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tempPassword) {
      setError("Temporary password is required");
      return;
    }

    if (tempPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      await onSave(tempPassword);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Password reset failed"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: 13 }}>
        Reset password for <b>{user.username}</b>
      </p>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <input
        type="password"
        placeholder="Temporary Password"
        value={tempPassword}
        onChange={(e) => setTempPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm Temporary Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <div style={{ marginTop: 12 }}>
        <button type="submit">Reset Password</button>
        <button
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
