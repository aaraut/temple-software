import { useEffect, useState } from "react";
import { listGotras, createGotra } from "../api/gotraApi";
import { useAuth } from "../context/AuthContext";
import GotraForm from "../components/GotraForm";
import "./GotraList.css";

export default function GotraList() {
  const { auth } = useAuth();

  const [gotras, setGotras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const isAdmin =
    auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  const loadGotras = async () => {
    try {
      setLoading(true);
      const data = await listGotras();
      setGotras(data);
      setError("");
    } catch {
      setError("Failed to load gotra list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGotras();
  }, []);

  const handleSave = async (payload) => {
    await createGotra(payload);
    setSuccess("Gotra added successfully");
    setShowForm(false);
    loadGotras();
  };

  return (
    <div className="gotra-page">
      <div className="gotra-header">
        <h2>Gotra Management</h2>
        <p className="subtitle">
          Manage gotras in Hindi and English
        </p>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {isAdmin && (
        <>
          {!showForm && (
            <button
              className="primary-btn"
              onClick={() => {
                setShowForm(true);
                setSuccess("");
              }}
            >
              + Add Gotra
            </button>
          )}

          {showForm && (
            <div style={{ marginTop: 16 }}>
              <GotraForm
                onSaved={handleSave}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
        </>
      )}

      <div className="gotra-card">
        {loading ? (
          <p className="status-text">Loading gotras...</p>
        ) : gotras.length === 0 ? (
          <p className="status-text">No gotras found</p>
        ) : (
          <table className="gotra-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Gotra (हिंदी)</th>
                <th>Gotra (English)</th>
              </tr>
            </thead>
            <tbody>
              {gotras.map((g, index) => (
                <tr key={g.id}>
                  <td>{index + 1}</td>
                  <td>{g.hindiName}</td>
                  <td>{g.englishName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
