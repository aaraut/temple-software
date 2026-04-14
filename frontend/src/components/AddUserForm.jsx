import { useState } from "react";

const L = {
  en: {
    title: "Add User",
    username: "Username",
    password: "Temp Password",
    role: "Role",
    fullName: "Full Name",
    phone: "Phone",
    dob: "Date of Birth",
    aadhaar: "Aadhaar Last 4 Digits",
    create: "Create User",
    cancel: "Cancel",
    errorRequired: "Username, password and role are required",
    errorAadhaar: "Aadhaar must be last 4 digits",
    errorFailed: "Failed to create user",
  },
  hi: {
    title: "यूज़र जोड़ें",
    username: "यूज़रनेम",
    password: "अस्थायी पासवर्ड",
    role: "भूमिका",
    fullName: "पूरा नाम",
    phone: "फोन नंबर",
    dob: "जन्म तिथि",
    aadhaar: "आधार के अंतिम 4 अंक",
    create: "यूज़र बनाएं",
    cancel: "रद्द करें",
    errorRequired: "यूज़रनेम, पासवर्ड और भूमिका आवश्यक हैं",
    errorAadhaar: "आधार के केवल अंतिम 4 अंक भरें",
    errorFailed: "यूज़र बनाने में विफल",
  },
};

export default function AddUserForm({ onSave, onCancel, allowedRoles, language = "hi" }) {
  const t = L[language] ?? L.en;

  const [form, setForm] = useState({
    username: "", password: "", role: "USER",
    name: "", phone: "", dob: "", aadhaarLast4: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password || !form.role) { setError(t.errorRequired); return; }
    if (form.aadhaarLast4 && form.aadhaarLast4.length !== 4) { setError(t.errorAadhaar); return; }
    try {
      await onSave(form);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t.errorFailed);
    }
  };

  return (
    <div className="add-user-card">
      <h3 className="add-user-title">{t.title}</h3>

      {error && <div className="add-user-error">{error}</div>}

      <form onSubmit={handleSubmit} className="add-user-form">
        <div className="add-user-grid">
          <div className="add-user-field">
            <label>{t.username} *</label>
            <input name="username" placeholder={t.username} onChange={handleChange} autoComplete="off" />
          </div>

          <div className="add-user-field">
            <label>{t.password} *</label>
            <input name="password" type="password" placeholder={t.password} onChange={handleChange} autoComplete="new-password" />
          </div>

          <div className="add-user-field">
            <label>{t.role} *</label>
            <select name="role" onChange={handleChange}>
              {allowedRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="add-user-field">
            <label>{t.fullName}</label>
            <input name="name" placeholder={t.fullName} onChange={handleChange} />
          </div>

          <div className="add-user-field">
            <label>{t.phone}</label>
            <input name="phone" placeholder={t.phone} onChange={handleChange} />
          </div>

          <div className="add-user-field">
            <label>{t.dob}</label>
            <input type="date" name="dob" onChange={handleChange} />
          </div>

          <div className="add-user-field">
            <label>{t.aadhaar}</label>
            <input name="aadhaarLast4" placeholder="XXXX" maxLength={4} onChange={handleChange} />
          </div>
        </div>

        <div className="add-user-actions">
          <button type="submit" className="add-user-btn-primary">{t.create}</button>
          <button type="button" className="add-user-btn-secondary" onClick={onCancel}>{t.cancel}</button>
        </div>
      </form>
    </div>
  );
}
