import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Typography
} from "@mui/material";

export default function DonationPurposeForm({
  initialData,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    nameHi: "",
    nameEn: "",
    fixedAmount: "",
    active: true,
    receiptPrefix: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        nameHi: initialData.nameHi || "",
        nameEn: initialData.nameEn || "",
        fixedAmount: initialData.fixedAmount || "",
        active: initialData.active ?? true,
        receiptPrefix: initialData.receiptPrefix || "",
      });
    }
  }, [initialData]);

  const prefixRegex = /^[A-Za-z0-9]{2,4}$/;

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    let newValue = value;

    if (name === "receiptPrefix") {
        newValue = value.toUpperCase();
    }

    setForm({
        ...form,
        [name]: type === "checkbox" ? checked : newValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.nameHi || !form.nameEn || !form.receiptPrefix) {
      setError("कृपया हिंदी और अंग्रेजी दोनों नाम भरें");
      return;
    }

    if (!prefixRegex.test(form.receiptPrefix)) {
        setError("प्रीफिक्स 2 से 4 अक्षर/अंक का होना चाहिए (केवल A-Z, 0-9)");
        return;
    }

    setError("");
    onSubmit(form);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} mt={1}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="उद्देश्य (हिंदी)"
            name="nameHi"
            value={form.nameHi}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Purpose (English)"
            name="nameEn"
            value={form.nameEn}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="निश्चित राशि (Optional)"
            name="fixedAmount"
            type="number"
            value={form.fixedAmount}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
        <TextField
            label="Receipt Prefix"
            name="receiptPrefix"
            value={form.receiptPrefix}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ maxLength: 4 }}
            helperText="जैसे: DN, AB, VIP, 2026 आदि"
        />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={handleChange}
                name="active"
              />
            }
            label="सक्रिय (Active)"
          />
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

        <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}