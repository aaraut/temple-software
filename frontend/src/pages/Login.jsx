import { useState } from "react";
import { loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("hi");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await loginApi(username, password);
      login(data, language);
      window.location.replace("/");
    } catch (err) {
      setError(
        language === "hi"
          ? "अमान्य यूज़रनेम या पासवर्ड"
          : "Invalid username or password"
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>

        {/* Icon */}
        <div className="login-temple-icon">🛕</div>

        {/* Title */}
        <h2>{language === "hi" ? "चमत्कारिक श्री हनुमान मंदिर जामसावली मंदिर लॉगिन" : "Chamatkarik Shree Hanuman Mandir Jamsawli Temple Login"}</h2>

        {/* Error */}
        {error && <p className="error">{error}</p>}

        {/* Inputs */}
        <div className="login-input-group">
          <div className="login-input-wrapper">
            <span className="login-input-icon">👤</span>
            <input
              type="text"
              placeholder={language === "hi" ? "यूज़रनेम" : "Username"}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="login-input-wrapper">
            <span className="login-input-icon">🔒</span>
            <input
              type="password"
              placeholder={language === "hi" ? "पासवर्ड" : "Password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        {/* Language Selection */}
        <div className="language-select-group">
          <label className="language-select-label">
            {language === "hi" ? "भाषा चुनें" : "Select Language"}
          </label>
          <div className="language-radio-group">
            <label className="language-radio-option">
              <input
                type="radio"
                name="language"
                value="hi"
                checked={language === "hi"}
                onChange={() => setLanguage("hi")}
              />
              <span>हिंदी</span>
            </label>
            <label className="language-radio-option">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === "en"}
                onChange={() => setLanguage("en")}
              />
              <span>English</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <button type="submit">
          {language === "hi" ? "लॉगिन करें" : "Login"}
        </button>

        <div className="login-divider" />

        {/* Forgot */}
        <p className="forgot" onClick={() => window.location.href = "/forgot-password"}>
          {language === "hi" ? "पासवर्ड भूल गए?" : "Forgot Password?"}
        </p>

      </form>
    </div>
  );
}
