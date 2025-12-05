// src/pages/GotraList.jsx
import React, { useEffect, useState } from "react";
import * as api from "../api/gotraApi";
import GotraForm from "../components/GotraForm";

export default function GotraList() {
  const [gotras, setGotras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // record being edited or null
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listGotras();
      console.log("Gotra API Response:", data);
      setGotras(data || []);
    } catch (err) {
      setError("Failed to load gotras: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (g) => {
    setEditing(g);
    setShowForm(true);
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`Delete gotra "${g.gotraNameEn}" ?`)) return;
    try {
      await api.deleteGotra(g.id);
      await load();
    } catch (err) {
      alert("Delete failed: " + (err?.response?.data?.error || err?.message));
    }
  };

  const handleSaved = async (payload) => {
    if (editing) {
      await api.updateGotra(editing.id, payload);
    } else {
      await api.createGotra(payload, "admin-ui");
    }
    setShowForm(false);
    setEditing(null);
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Gotra Master</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleCreate}>Add Gotra</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!loading && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Hindi</th>
              <th style={{ padding: 8 }}>English</th>
              <th style={{ padding: 8 }}>Created By</th>
              <th style={{ padding: 8 }}>Created At</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gotras.map((g) => (
              <tr key={g.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td style={{ padding: 8, width: 220, fontSize: 12 }}>{g.id}</td>
                <td style={{ padding: 8 }}>{g.gotraNameHi}</td>
                <td style={{ padding: 8 }}>{g.gotraNameEn}</td>
                <td style={{ padding: 8 }}>{g.createdBy}</td>
                <td style={{ padding: 8 }}>{new Date(g.createdAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => handleEdit(g)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(g)}>Delete</button>
                </td>
              </tr>
            ))}
            {gotras.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16 }}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* form area */}
      {showForm && (
        <div style={{ marginTop: 16 }}>
          <h3>{editing ? "Edit Gotra" : "Add Gotra"}</h3>
          <GotraForm
            initial={editing}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
}
