import React, { useEffect, useState } from "react";
import { Button, TextField, Grid, Card, CardContent, Typography } from "@mui/material";

const L = {
  en: {
    add: "➕ Add Inventory Item",
    update: "✏️ Update Inventory Item",
    nameLabel: "Material Name",
    unit: "Unit",
    rate: "Rate",
    stock: "Stock",
    addBtn: "ADD",
    updateBtn: "UPDATE",
    cancel: "CANCEL",
  },
  hi: {
    add: "➕ सामग्री जोड़ें",
    update: "✏️ सामग्री अपडेट करें",
    nameLabel: "सामग्री का नाम",
    unit: "इकाई",
    rate: "दर",
    stock: "स्टॉक",
    addBtn: "जोड़ें",
    updateBtn: "अपडेट करें",
    cancel: "रद्द करें",
  },
};

const emptyForm = {
  id: null,
  materialNameHi: "",
  unit: "NOS",
  rate: "",
  totalStock: "",
};

const InventoryForm = ({ category, editingItem, onSubmit, onCancel, loading, language = "hi" }) => {
  const [form, setForm] = useState(emptyForm);
  const t = L[language] ?? L.en;

  useEffect(() => {
    if (editingItem) {
      setForm(editingItem);
    } else {
      setForm(emptyForm); // resets unit back to NOS for new entries
    }
  }, [editingItem]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => onSubmit({ ...form, category });

  return (
    <Card sx={{ mb: 3, borderLeft: editingItem ? "6px solid #7a1f1f" : "none" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editingItem ? t.update : t.add}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label={t.nameLabel}
              name="materialNameHi"
              value={form.materialNameHi}
              onChange={handleChange}
              fullWidth
              autoFocus
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label={t.unit}
              name="unit"
              value={form.unit}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label={t.rate}
              type="number"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label={t.stock}
              type="number"
              name="totalStock"
              value={form.totalStock}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2} alignSelf="center">
            <Button variant="contained" fullWidth onClick={handleSubmit} disabled={loading}>
              {editingItem ? t.updateBtn : t.addBtn}
            </Button>
            {editingItem && (
              <Button fullWidth sx={{ mt: 1 }} onClick={onCancel} disabled={loading}>
                {t.cancel}
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;
