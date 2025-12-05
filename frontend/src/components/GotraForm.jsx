// src/components/GotraForm.jsx
import React, { useState, useEffect } from "react";

export default function GotraForm({ initial = null, onCancel, onSaved }) {
  const [gotraHi, setGotraHi] = useState("");
  const [gotraEn, setGotraEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initial) {
      setGotraHi(initial.gotraNameHi || "");
      setGotraEn(initial.gotraNameEn || "");
    } else {
      setGotraHi("");
      setGotraEn("");
    }
    setError(null);
  }, [initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!gotraHi || !gotraEn) {
      setError("दोनों नाम भरें (Hindi और English).");
      return;
    }
    setSaving(true);
    try {
      await onSaved({ gotraNameHi: gotraHi, gotraNameEn: gotraEn });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, background: "#fff" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 13 }}>Gotra (हिंदी)</label>
          <input
            value={gotraHi}
            onChange={(e) => setGotraHi(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="कश्यप"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 13 }}>Gotra (English)</label>
          <input
            value={gotraEn}
            onChange={(e) => setGotraEn(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="Kashyap"
          />
        </div>

        {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={saving} style={{ padding: "8px 12px" }}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: "8px 12px" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
