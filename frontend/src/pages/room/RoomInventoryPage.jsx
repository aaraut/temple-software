import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
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
  getAmenities,
  updateCleaningStatus,
  deleteRoom
} from "../../api/roomApi";

import { useAuth } from "../../context/AuthContext";

export default function RoomInventoryPage() {
  const { auth } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    roomNumber: "",
    categoryId: "",
    blockName: "",
    floor: "",
    maxOccupancy: "",
    baseRent24Hr: "",
    baseRentFixed: "",
    baseRent3Hr: "",
    baseRent6Hr: "",
    defaultSecurityDeposit: "",
    remarks: "",
    amenities: [],
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ---------------- Load Data ----------------

  const loadAll = async () => {
    const [roomData, catData, amenityData] = await Promise.all([
      getRooms(),
      getRoomCategories(),
      getAmenities(),
    ]);

    setRooms(roomData);
    setCategories(catData);
    setAmenities(amenityData);
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

  const handleAmenityChange = (amenityId, quantity) => {
    const updated = [...form.amenities];
    const index = updated.findIndex((a) => a.amenityId === amenityId);

    if (index > -1) {
      updated[index].quantity = quantity;
    } else {
      updated.push({ amenityId, quantity });
    }

    setForm({ ...form, amenities: updated });
  };

  const resetForm = () => {
    setForm({
      roomNumber: "",
      categoryId: "",
      blockName: "",
      floor: "",
      maxOccupancy: "",
      baseRent24Hr: "",
      baseRentFixed: "",
      baseRent3Hr: "",
      baseRent6Hr: "",
      defaultSecurityDeposit: "",
      remarks: "",
      amenities: [],
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateRoom(editingId, {
          ...form,
          createdBy: auth.username,
        });
        setSuccess("Room updated successfully");
      } else {
        await createRoom({
          ...form,
          createdBy: auth.username,
        });
        setSuccess("Room created successfully");
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
      blockName: room.blockName || "",
      floor: room.floor || "",
      maxOccupancy: room.maxOccupancy || "",
      baseRent24Hr: room.baseRent24Hr || "",
      baseRentFixed: room.baseRentFixed || "",
      baseRent3Hr: room.baseRent3Hr || "",
      baseRent6Hr: room.baseRent6Hr || "",
      defaultSecurityDeposit: room.defaultSecurityDeposit || "",
      remarks: room.remarks || "",
      amenities: [],
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

  

  if (loading) return <p>Loading...</p>;

  return (
    <Box sx={{ maxWidth: 1100, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Room Inventory Management
      </Typography>

      {/* ---------------- FORM ---------------- */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? "Edit Room" : "Create Room"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Room Number"
              name="roomNumber"
              value={form.roomNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                name="categoryId"
                value={form.categoryId}
                label="Category"
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

          {[
            { label: "Block", name: "blockName" },
            { label: "Floor", name: "floor" },
            { label: "Max Occupancy", name: "maxOccupancy", type: "number" },
            { label: "24Hr Rent", name: "baseRent24Hr", type: "number" },
            { label: "Fixed Rent", name: "baseRentFixed", type: "number" },
            { label: "3Hr Rent", name: "baseRent3Hr", type: "number" },
            { label: "6Hr Rent", name: "baseRent6Hr", type: "number" },
            {
              label: "Security Deposit",
              name: "defaultSecurityDeposit",
              type: "number",
            },
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

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Remarks"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>

          {/* Amenities */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">Amenities</Typography>
            <Grid container spacing={2}>
              {amenities.map((a) => (
                <Grid item xs={3} key={a.id}>
                  <TextField
                    fullWidth
                    type="number"
                    label={a.name}
                    onChange={(e) =>
                      handleAmenityChange(a.id, Number(e.target.value))
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
            >
              {editingId ? "Update Room" : "Create Room"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ---------------- TABLE ---------------- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Existing Rooms
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Room</TableCell>
              <TableCell>Block</TableCell>
              <TableCell>Floor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Cleaning</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.roomNumber}</TableCell>
                <TableCell>{r.blockName}</TableCell>
                <TableCell>{r.floor}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>
                  <FormControl sx={{ minWidth: 180 }}>
                    <Select
                      value={r.cleaningStatus}
                      onChange={(e) =>
                        handleCleaningChange(r.id, e.target.value)
                      }
                    >
                      <MenuItem value="CLEAN">CLEAN</MenuItem>
                      <MenuItem value="DIRTY">DIRTY</MenuItem>
                      <MenuItem value="CLEANING_IN_PROGRESS">
                        CLEANING_IN_PROGRESS
                      </MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEdit(r)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={async () => {
                        await deleteRoom(r.id, auth.username);
                        await loadAll();
                    }}
                    >
                    Delete
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
