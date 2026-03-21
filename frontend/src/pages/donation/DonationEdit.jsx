import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getDonationFormMetadata,
} from "../../api/donationApi";
import axiosClient from "../../api/axiosClient";

export default function DonationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, language } = useAuth();

  const isViewMode = new URLSearchParams(location.search).get("mode") === "view";

  const [metadata, setMetadata] = useState(null);
  const [form, setForm] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMetadata();
    loadDonation();
  }, []);

  const loadMetadata = async () => {
    const data = await getDonationFormMetadata();
    setMetadata(data);
  };

  const loadDonation = async () => {
    const res = await axiosClient.get(`/donation/${id}`);
    setForm(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectedPurpose = metadata?.purposes?.find(
    (p) => p.id === Number(form.purposeId)
  );

  const requiresGotra = selectedPurpose?.requiresGotra;

  const handleUpdate = async () => {
    try {
      await axiosClient.put(
        `/donation/${id}?username=${auth.username}`,
        form
      );
      setSuccess("Donation updated successfully");
      setTimeout(() => navigate(-1), 1000);
    } catch (e) {
      setError("Update failed");
    }
  };

  if (!metadata) return null;

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", mt: 3 }}>
      <Typography variant="h6" mb={2}>
        {isViewMode ? "View Donation" : "Update Donation"}
      </Typography>

      <TextField
        fullWidth
        label="Donor Name"
        name="donorName"
        value={form.donorName || ""}
        onChange={handleChange}
        margin="normal"
        disabled={isViewMode}
      />

      <TextField
        fullWidth
        label="Mobile"
        name="mobile"
        value={form.mobile || ""}
        onChange={handleChange}
        margin="normal"
        disabled={isViewMode}
      />

      {/* Purpose */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Purpose</InputLabel>
        <Select
          name="purposeId"
          value={form.purposeId || ""}
          label="Purpose"
          onChange={handleChange}
          disabled={isViewMode}
        >
          {metadata.purposes.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.nameEn}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Amount */}
      <TextField
        fullWidth
        label="Amount"
        name="amount"
        value={form.amount || ""}
        onChange={handleChange}
        margin="normal"
        disabled={isViewMode || selectedPurpose?.fixedAmount != null}
      />

      {/* Gotra */}
      {requiresGotra && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Gotra</InputLabel>
          <Select
            name="gotraId"
            value={form.gotraId || ""}
            label="Gotra"
            onChange={handleChange}
            disabled={isViewMode}
          >
            {metadata.gotras.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.nameEn}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!isViewMode && (
        <Button
          variant="contained"
          onClick={handleUpdate}
          sx={{ mt: 2 }}
        >
          Update
        </Button>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}