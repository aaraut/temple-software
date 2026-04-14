import { useState } from "react";

const L = {
  en: {
    info: (u) => `Reset password for`,
    tempPassword: "Temporary Password",
    confirmPassword: "Confirm Temporary Password",
    reset: "Reset Password",
    cancel: "Cancel",
    errorRequired: "Temporary password is required",
    errorMatch: "Passwords do not match",
    errorFailed: "Password reset failed",
  },
  hi: {
    info: (u) => `पासवर्ड रीसेट करें`,
    tempPassword: "अस्थायी पासवर्ड",
    confirmPassword: "अस्थायी पासवर्ड की पुष्टि करें",
    reset: "पासवर्ड रीसेट करें",
    cancel: "रद्द करें",
    errorRequired: "अस्थायी पासवर्ड आवश्यक है",
    errorMatch: "पासवर्ड मेल नहीं खाते",
    errorFailed: "पासवर्ड रीसेट विफल",
  },
};

export default function ResetPasswordForm({ user, onSave, onCancel, language = "hi" }) {
  const t = L[language] ?? L.en;

  const [tempPassword, setTempPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tempPassword) { setError(t.errorRequired); return; }
    if (tempPassword !== confirm) { setError(t.errorMatch); return; }

    try {
      await onSave(tempPassword);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t.errorFailed);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: 13 }}>
        {t.info()} <b>{user.username}</b>
      </p>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

      <input type="password" placeholder={t.tempPassword} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
      <input type="password" placeholder={t.confirmPassword} value={confirm} onChange={(e) => setConfirm(e.target.value)} />

      <div style={{ marginTop: 12 }}>
        <button type="submit">{t.reset}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>{t.cancel}</button>
      </div>
    </form>
  );
}
