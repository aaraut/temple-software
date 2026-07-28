import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
} from "@mui/material";

import { getRoomCategories, createRoomCategory, updateRoomCategory } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { name: "", description: "", pricingType: "FIXED", isActive: true };

export default function RoomCategoryPage() {
  const { language } = useAuth();

  const L = {
    en: {
      title: "Room Categories", editCategory: "Edit Category", createCategory: "Create Category",
      name: "Name", description: "Description", pricingType: "Pricing Type",
      fixed: "Fixed", personCount: "Person Count", active: "Active",
      existing: "Existing Categories", status: "Status", action: "Action",
      edit: "Edit", save: "Save", update: "Update Category",
    },
    hi: {
      title: "कमरा श्रेणियाँ", editCategory: "श्रेणी एडिट करें", createCategory: "नई श्रेणी बनाएं",
      name: "नाम", description: "विवरण", pricingType: "मूल्य निर्धारण प्रकार",
      fixed: "निश्चित", personCount: "व्यक्ति-आधारित", active: "सक्रिय",
      existing: "मौजूदा श्रेणियाँ", status: "स्थिति", action: "कार्य",
      edit: "एडिट", save: "सेव", update: "श्रेणी अपडेट करें",
    },
  };
  const t = L[language] ?? L.en;

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const data = await getRoomCategories();
    setCategories(data);
  };

  useEffect(() => {
    async function init() {
      try {
        await load();
      } catch {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!form.name.trim()) {
      setError(language === "hi" ? "नाम आवश्यक है" : "Name is required");
      return;
    }
    try {
      if (editingId) {
        await updateRoomCategory(editingId, form);
        setSuccess(language === "hi" ? "श्रेणी अपडेट हुई" : "Category updated");
      } else {
        await createRoomCategory(form);
        setSuccess(language === "hi" ? "श्रेणी बनाई गई" : "Category created");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || "",
      pricingType: cat.pricingType || "FIXED",
      isActive: cat.isActive,
    });
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <p>{language === "hi" ? "लोड हो रहा है..." : "Loading..."}</p>;

  return (
    <Box sx={{ maxWidth: 800, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>{t.title}</Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? t.editCategory : t.createCategory}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField fullWidth label={t.name} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>{t.pricingType}</InputLabel>
              <Select
                label={t.pricingType}
                value={form.pricingType}
                onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
              >
                <MenuItem value="FIXED">{t.fixed}</MenuItem>
                <MenuItem value="PERSON_COUNT">{t.personCount}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label={t.description}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              }
              label={t.active}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={handleSubmit}>
              {editingId ? t.update : t.createCategory}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>{t.existing}</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.pricingType}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.pricingType === "PERSON_COUNT" ? t.personCount : t.fixed}</TableCell>
                <TableCell>{c.isActive ? t.active : "-"}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(c)}>{t.edit}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
