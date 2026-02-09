import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography
} from "@mui/material";

const emptyForm = {
  id: null,
  materialNameHi: "",
  unit: "",
  rate: "",
  totalStock: "",
};

const InventoryForm = ({
  category,
  editingItem,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(editingItem ? editingItem : emptyForm);
  }, [editingItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit({ ...form, category });
  };

  return (
    <Card sx={{ mb: 3, borderLeft: editingItem ? "6px solid #7a1f1f" : "none" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editingItem ? "✏️ Update Inventory Item" : "➕ Add Inventory Item"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="सामग्री का नाम (Hindi)"
              name="materialNameHi"
              value={form.materialNameHi}
              onChange={handleChange}
              fullWidth
              autoFocus
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="Unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="Rate"
              type="number"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="Stock"
              type="number"
              name="totalStock"
              value={form.totalStock}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={2} alignSelf="center">
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={loading}
            >
              {editingItem ? "UPDATE" : "ADD"}
            </Button>

            {editingItem && (
              <Button
                fullWidth
                sx={{ mt: 1 }}
                onClick={onCancel}
                disabled={loading}
              >
                CANCEL
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;
