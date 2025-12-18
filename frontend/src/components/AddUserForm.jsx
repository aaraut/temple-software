import { useState } from "react";

export default function AddUserForm({ onSave, onCancel, allowedRoles }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "USER",
    name: "",
    phone: "",
    dob: "",
    aadhaarLast4: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password || !form.role) {
      setError("Username, password and role are required");
      return;
    }

    if (form.aadhaarLast4 && form.aadhaarLast4.length !== 4) {
      setError("Aadhaar must be last 4 digits");
      return;
    }

    try {
      await onSave(form);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user"
      );
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 6 }}>
      <h3>Add User</h3>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" onChange={handleChange} />
        <input
          name="password"
          placeholder="Temp Password"
          onChange={handleChange}
        />

        <select name="role" onChange={handleChange}>
          {allowedRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <input name="name" placeholder="Full Name" onChange={handleChange} />
        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input type="date" name="dob" onChange={handleChange} />
        <input
          name="aadhaarLast4"
          placeholder="Aadhaar Last 4"
          maxLength={4}
          onChange={handleChange}
        />

        <div style={{ marginTop: 10 }}>
          <button type="submit">Create</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
