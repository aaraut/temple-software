import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Button, Snackbar, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Divider
} from "@mui/material";

import { listGotras, createGotra } from "../api/gotraApi";
import { useAuth } from "../context/AuthContext";
import GotraForm from "../components/GotraForm";

const L = {
  en: {
    title: "Gotra Management",
    subtitle: "Manage gotras in Hindi and English",
    addBtn: "+ Add Gotra",
    noData: "No gotras found",
    colNo: "#",
    colHindi: "Gotra (हिंदी)",
    colEnglish: "Gotra (English)",
    successAdd: "Gotra added successfully",
    errorLoad: "Failed to load gotra list",
  },
  hi: {
    title: "गोत्र प्रबंधन",
    subtitle: "गोत्र को हिंदी और अंग्रेजी में प्रबंधित करें",
    addBtn: "+ गोत्र जोड़ें",
    noData: "कोई गोत्र नहीं मिला",
    colNo: "#",
    colHindi: "गोत्र (हिंदी)",
    colEnglish: "गोत्र (अंग्रेजी)",
    successAdd: "गोत्र सफलतापूर्वक जोड़ा गया",
    errorLoad: "गोत्र सूची लोड करने में विफल",
  },
};

export default function GotraList() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;

  const [gotras, setGotras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const isAdmin = auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  const loadGotras = async () => {
    try {
      setLoading(true);
      const data = await listGotras();
      setGotras(data);
      setError("");
    } catch {
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGotras(); }, []);

  const handleSave = async (payload) => {
    await createGotra(payload);
    setSuccess(t.successAdd);
    setShowForm(false);
    loadGotras();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>{t.title}</Typography>
            <Typography variant="body2" color="text.secondary">{t.subtitle}</Typography>
          </Box>
          {isAdmin && !showForm && (
            <Button variant="contained" onClick={() => { setShowForm(true); setSuccess(""); }}>
              {t.addBtn}
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
          <Alert severity="success">{success}</Alert>
        </Snackbar>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Form */}
        {isAdmin && showForm && (
          <Box sx={{ mb: 4 }}>
            <GotraForm onSaved={handleSave} onCancel={() => setShowForm(false)} language={language} />
          </Box>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
        ) : gotras.length === 0 ? (
          <Typography align="center" color="text.secondary">{t.noData}</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.colNo}</TableCell>
                <TableCell>{t.colHindi}</TableCell>
                <TableCell>{t.colEnglish}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gotras.map((g, index) => (
                <TableRow key={g.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{g.hindiName}</TableCell>
                  <TableCell>{g.englishName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

      </Paper>
    </Box>
  );
}
