import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Divider
} from "@mui/material";

import { listGotras, createGotra } from "../api/gotraApi";
import { useAuth } from "../context/AuthContext";
import GotraForm from "../components/GotraForm";

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
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Gotra Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage gotras in Hindi and English
            </Typography>
          </Box>

          {isAdmin && !showForm && (
            <Button
              variant="contained"
              onClick={() => {
                setShowForm(true);
                setSuccess("");
              }}
            >
              + Add Gotra
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Alerts */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess("")}
        >
          <Alert severity="success">{success}</Alert>
        </Snackbar>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        {isAdmin && showForm && (
          <Box sx={{ mb: 4 }}>
            <GotraForm
              onSaved={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </Box>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : gotras.length === 0 ? (
          <Typography align="center" color="text.secondary">
            No gotras found
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Gotra (हिंदी)</TableCell>
                <TableCell>Gotra (English)</TableCell>
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