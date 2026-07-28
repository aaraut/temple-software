import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from "@mui/material";

import {
  getRooms,
  createRoom,
  updateRoom,
  getRoomCategories,
  getBhaktniwasBlocks,
  updateCleaningStatus,
  deleteRoom
} from "../../api/roomApi";

import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  roomNumber: "",
  categoryId: "",
  bhaktniwasBlockId: "",
  floor: "",
  maxOccupancy: "",
  baseRent24Hr: "",
  defaultSecurityDeposit: "",
  allowExtraPerson: false,
  extraPersonCost: "",
  remarks: "",
};

export default function RoomInventoryPage() {
  const { auth, language } = useAuth();

  const L = {
    en: {
      title: "Room Inventory Management",
      editRoom: "Edit Room",
      createRoom: "Create Room",
      roomNumber: "Room Number",
      category: "Category",
      block: "Block",
      floor: "Floor",
      maxOccupancy: "Max Occupancy",
      baseRent: "Base Rent (Per Day)",
      deposit: "Security Deposit",
      allowExtraPerson: "Allow Extra Person",
      extraPersonCost: "Extra Person Cost",
      remarks: "Remarks",
      existingRooms: "Existing Rooms",
      room: "Room",
      category2: "Category",
      status: "Status",
      cleaning: "Cleaning",
      action: "Action",
      edit: "Edit",
      delete: "Delete",
      updateRoom: "Update Room",
    },
    hi: {
      title: "कमरा सूची प्रबंधन",
      editRoom: "कमरा एडिट करें",
      createRoom: "नया कमरा बनाएं",
      roomNumber: "कमरा नंबर",
      category: "श्रेणी",
      block: "ब्लॉक",
      floor: "मंजिल",
      maxOccupancy: "अधिकतम क्षमता",
      baseRent: "मूल किराया (प्रति दिन)",
      deposit: "सुरक्षा जमा",
      allowExtraPerson: "अतिरिक्त व्यक्ति की अनुमति",
      extraPersonCost: "अतिरिक्त व्यक्ति शुल्क",
      remarks: "टिप्पणी",
      existingRooms: "मौजूदा कमरे",
      room: "कमरा",
      category2: "श्रेणी",
      status: "स्थिति",
      cleaning: "सफाई",
      action: "कार्य",
      edit: "एडिट",
      delete: "डिलीट",
      updateRoom: "कमरा अपडेट करें",
    },
  };
  const t = L[language] ?? L.en;

  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ---------------- Load Data ----------------

  const loadAll = async () => {
    const [roomData, catData, blockData] = await Promise.all([
      getRooms(),
      getRoomCategories(),
      getBhaktniwasBlocks(),
    ]);

    setRooms(roomData);
    setCategories(catData);
    setBlocks(blockData);
  };

  useEffect(() => {
    async function init() {
      try {
        await loadAll();
      } catch {
        setError("Failed to load room data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ---------------- Handlers ----------------

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateRoom(editingId, { ...form, createdBy: auth.username });
        setSuccess(language === "hi" ? "कमरा सफलतापूर्वक अपडेट हुआ" : "Room updated successfully");
      } else {
        await createRoom({ ...form, createdBy: auth.username });
        setSuccess(language === "hi" ? "कमरा सफलतापूर्वक बनाया गया" : "Room created successfully");
      }

      resetForm();
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (room) => {
    setForm({
      roomNumber: room.roomNumber,
      categoryId: room.categoryId || "",
      bhaktniwasBlockId: room.bhaktniwasBlockId || "",
      floor: room.floor || "",
      maxOccupancy: room.maxOccupancy || "",
      baseRent24Hr: room.baseRent24Hr || "",
      defaultSecurityDeposit: room.defaultSecurityDeposit || "",
      allowExtraPerson: !!room.allowExtraPerson,
      extraPersonCost: room.extraPersonCost || "",
      remarks: room.remarks || "",
    });

    setEditingId(room.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCleaningChange = async (roomId, status) => {
    try {
      await updateCleaningStatus(roomId, {
        cleaningStatus: status,
        handledBy: auth.username,
      });
      await loadAll();
    } catch {
      setError("Failed to update cleaning status");
    }
  };

  const categoryName = (categoryId) =>
    categories.find((c) => c.id === categoryId)?.name || "-";

  if (loading) return <p>{language === "hi" ? "लोड हो रहा है..." : "Loading..."}</p>;

  return (
    <Box sx={{ maxWidth: 1100, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t.title}
      </Typography>

      {/* ---------------- FORM ---------------- */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? t.editRoom : t.createRoom}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t.roomNumber}
              name="roomNumber"
              value={form.roomNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>{t.category}</InputLabel>
              <Select
                name="categoryId"
                value={form.categoryId}
                label={t.category}
                onChange={handleChange}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>{t.block}</InputLabel>
              <Select
                name="bhaktniwasBlockId"
                value={form.bhaktniwasBlockId}
                label={t.block}
                onChange={handleChange}
              >
                {blocks.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {[
            { label: t.floor, name: "floor" },
            { label: t.maxOccupancy, name: "maxOccupancy", type: "number" },
            { label: t.baseRent, name: "baseRent24Hr", type: "number" },
            { label: t.deposit, name: "defaultSecurityDeposit", type: "number" },
          ].map((field) => (
            <Grid item xs={4} key={field.name}>
              <TextField
                fullWidth
                type={field.type || "text"}
                label={field.label}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
              />
            </Grid>
          ))}

          <Grid item xs={4} sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.allowExtraPerson}
                  onChange={(e) => setForm({ ...form, allowExtraPerson: e.target.checked })}
                />
              }
              label={t.allowExtraPerson}
            />
          </Grid>

          {form.allowExtraPerson && (
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label={t.extraPersonCost}
                value={form.extraPersonCost}
                onChange={(e) => setForm({ ...form, extraPersonCost: e.target.value })}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t.remarks}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={handleSubmit}>
              {editingId ? t.updateRoom : t.createRoom}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ---------------- TABLE ---------------- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t.existingRooms}
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.room}</TableCell>
              <TableCell>{t.block}</TableCell>
              <TableCell>{t.category2}</TableCell>
              <TableCell>{t.floor}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.cleaning}</TableCell>
              <TableCell>{t.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.roomNumber}</TableCell>
                <TableCell>{r.blockName}</TableCell>
                <TableCell>{categoryName(r.categoryId)}</TableCell>
                <TableCell>{r.floor}</TableCell>
                <TableCell>
                  {r.status === "AVAILABLE" ? (language === "hi" ? "उपलब्ध" : "Available")
                    : r.status === "MAINTENANCE" ? (language === "hi" ? "रखरखाव" : "Maintenance")
                    : r.status === "BLOCKED" ? (language === "hi" ? "अवरुद्ध" : "Blocked")
                    : r.status}
                </TableCell>
                <TableCell>
                  <FormControl sx={{ minWidth: 180 }}>
                    <Select
                      value={r.cleaningStatus}
                      onChange={(e) => handleCleaningChange(r.id, e.target.value)}
                    >
                      <MenuItem value="CLEAN">{language === "hi" ? "साफ" : "Clean"}</MenuItem>
                      <MenuItem value="DIRTY">{language === "hi" ? "गंदा" : "Dirty"}</MenuItem>
                      <MenuItem value="CLEANING_IN_PROGRESS">{language === "hi" ? "सफाई जारी" : "Cleaning in Progress"}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(r)}>{t.edit}</Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={async () => { await deleteRoom(r.id, auth.username); await loadAll(); }}
                  >
                    {t.delete}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
