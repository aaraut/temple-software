import { useState } from "react";

const L = {
  en: {
    fullName: "Full Name",
    phone: "Phone",
    aadhaar: "Aadhaar Last 4",
    active: "Active",
    save: "Save",
    cancel: "Cancel",
    errorAadhaar: "Aadhaar must be 4 digits",
    errorFailed: "Update failed",
  },
  hi: {
    fullName: "पूरा नाम",
    phone: "फोन",
    aadhaar: "आधार के अंतिम 4 अंक",
    active: "सक्रिय",
    save: "सहेजें",
    cancel: "रद्द करें",
    errorAadhaar: "आधार के केवल 4 अंक भरें",
    errorFailed: "अपडेट विफल",
  },
};

export default function EditUserForm({ user, onSave, onCancel, language = "hi" }) {
  const t = L[language] ?? L.en;

  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    dob: user.dob || "",
    aadhaarLast4: user.aadhaarLast4 || "",
    active: user.active,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.aadhaarLast4 && form.aadhaarLast4.length !== 4) {
      setError(t.errorAadhaar); return;
    }
    try {
      await onSave(form);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t.errorFailed);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

      <input name="name" placeholder={t.fullName} value={form.name} onChange={handleChange} />
      <input name="phone" placeholder={t.phone} value={form.phone} onChange={handleChange} />
      <input type="date" name="dob" value={form.dob} onChange={handleChange} />
      <input name="aadhaarLast4" placeholder={t.aadhaar} maxLength={4} value={form.aadhaarLast4} onChange={handleChange} />

      <label style={{ display: "block", marginTop: 8 }}>
        <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />{" "}
        {t.active}
      </label>

      <div style={{ marginTop: 12 }}>
        <button type="submit">{t.save}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>{t.cancel}</button>
      </div>
    </form>
  );
}
