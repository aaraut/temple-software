// src/components/GotraForm.jsx

import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  Box,
  Alert,
  Divider
} from "@mui/material";

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
      await onSaved({
        gotraNameHi: gotraHi,
        gotraNameEn: gotraEn
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        maxWidth: 500,
        mx: "auto"
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {initial ? "Edit Gotra" : "Add New Gotra"}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Gotra (हिंदी)"
              value={gotraHi}
              onChange={(e) => setGotraHi(e.target.value)}
              placeholder="कश्यप"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Gotra (English)"
              value={gotraEn}
              onChange={(e) => setGotraEn(e.target.value)}
              placeholder="Kashyap"
            />
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">
                {error}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                type="submit"
                disabled={saving}
                fullWidth
              >
                {saving ? "Saving..." : "Save"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={onCancel}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Grid>

        </Grid>
      </Box>
    </Paper>
  );
}