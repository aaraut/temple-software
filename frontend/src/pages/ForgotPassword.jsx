import { useState } from "react";
import { forgotPasswordApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    dob: "",
    aadhaarLast4: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await forgotPasswordApi({
        username: form.username,
        dob: form.dob,
        aadhaarLast4: form.aadhaarLast4,
        newPassword: form.newPassword,
      });

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setError("Identity verification failed");
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input type="date" name="dob" onChange={handleChange} required />
        <input
          name="aadhaarLast4"
          placeholder="Aadhaar Last 4 Digits"
          maxLength={4}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          onChange={handleChange}
          required
        />

        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
