import { useState } from "react";

export default function EditUserForm({ user, onSave, onCancel }) {
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
      setError("Aadhaar must be 4 digits");
      return;
    }

    try {
      await onSave(form);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Update failed"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
      <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
      <input type="date" name="dob" value={form.dob} onChange={handleChange} />
      <input
        name="aadhaarLast4"
        placeholder="Aadhaar Last 4"
        maxLength={4}
        value={form.aadhaarLast4}
        onChange={handleChange}
      />

      <label style={{ display: "block", marginTop: 8 }}>
        <input
          type="checkbox"
          name="active"
          checked={form.active}
          onChange={handleChange}
        />{" "}
        Active
      </label>

      <div style={{ marginTop: 12 }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
