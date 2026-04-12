import React, { useState, useEffect } from "react";
import {
  Button, TextField, Paper, Typography,
  Grid, Box, Alert, Divider
} from "@mui/material";

const L = {
  en: {
    addTitle: "Add New Gotra",
    editTitle: "Edit Gotra",
    labelHindi: "Gotra (हिंदी)",
    labelEnglish: "Gotra (English)",
    placeholderHindi: "कश्यप",
    placeholderEnglish: "Kashyap",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    errorBoth: "Please fill both Hindi and English names.",
  },
  hi: {
    addTitle: "नया गोत्र जोड़ें",
    editTitle: "गोत्र एडिट करें",
    labelHindi: "गोत्र (हिंदी)",
    labelEnglish: "गोत्र (अंग्रेजी)",
    placeholderHindi: "कश्यप",
    placeholderEnglish: "Kashyap",
    save: "नया गोत्र जोड़ें",
    saving: "जोड़ रहे हैं...",
    cancel: "रद्द करें",
    errorBoth: "दोनों नाम भरें (हिंदी और अंग्रेजी)।",
  },
};

export default function GotraForm({ initial = null, onCancel, onSaved, language = "hi" }) {
  const t = L[language] ?? L.en;

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
      setError(t.errorBoth);
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
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {initial ? t.editTitle : t.addTitle}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t.labelHindi}
              value={gotraHi}
              onChange={(e) => setGotraHi(e.target.value)}
              placeholder={t.placeholderHindi}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t.labelEnglish}
              value={gotraEn}
              onChange={(e) => setGotraEn(e.target.value)}
              placeholder={t.placeholderEnglish}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button variant="contained" type="submit" disabled={saving} sx={{ minWidth: 180 }}>
                {saving ? t.saving : t.save}
              </Button>
              <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ minWidth: 120 }}>
                {t.cancel}
              </Button>
            </Box>
          </Grid>

        </Grid>
      </Box>
    </Paper>
  );
}
