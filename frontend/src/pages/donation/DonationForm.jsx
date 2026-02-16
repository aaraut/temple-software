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
} from "@mui/material";

import { getDonationFormMetadata, createDonation, createDonationAndPrint  } from "../../api/donationApi";
import { useAuth } from "../../context/AuthContext";
import LanguageToggle from "../../components/LanguageToggle";



export default function DonationForm() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("hi");

  const [form, setForm] = useState({
    donorName: "",
    address: "",
    mobile: "",
    purposeId: "",
    amount: "",
    gotraId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { auth } = useAuth();

  // ---------------- Load metadata ----------------

  useEffect(() => {
    async function load() {
      try {
        const data = await getDonationFormMetadata();
        setMetadata(data);
      } catch (e) {
        setError("Failed to load donation metadata");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------------- Helpers ----------------

    const selectedPurpose = metadata?.purposes.find(
    (p) => p.id === Number(form.purposeId)
    );

  const requiresGotra = selectedPurpose?.requiresGotra;

  // auto set Kashyap if gotra required
  useEffect(() => {
    if (requiresGotra && !form.gotraId) {
      const kashyap = metadata.gotras.find((g) => g.default);
      if (kashyap) {
        setForm((f) => ({ ...f, gotraId: kashyap.id }));
      }
    }
  }, [requiresGotra, metadata, form.gotraId]);

  // fixed amount logic
  useEffect(() => {
    if (!selectedPurpose) return;
    if (selectedPurpose?.fixedAmount != null) {
      setForm((f) => ({
        ...f,
        amount: selectedPurpose.fixedAmount,
      }));
    } else {
    setForm((f) => ({
      ...f,
      amount: "",
    }));
  }
  }, [selectedPurpose]);

  // ---------------- Handlers ----------------

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    try {
      const payload = {
        donorName: form.donorName,
        address: form.address,
        mobile: form.mobile,
        purposeId: form.purposeId,
        amount:
          selectedPurpose?.fixedAmount != null
            ? selectedPurpose.fixedAmount
            : form.amount,
        gotraId: requiresGotra ? form.gotraId : null,
      };

      const resp = await createDonation(payload, auth.username);
      setSuccess(`Donation saved. Receipt: ${resp.receiptNumber}`);

      // reset form
      setForm({
        donorName: "",
        address: "",
        mobile: "",
        purposeId: "",
        amount: "",
        gotraId: "",
      });
    } catch (e) {
      setError(
        e.response?.data?.message || "Failed to save donation"
      );
    }
  };

  if (loading) return <p>Loading...</p>;

  // ---------------- UI ----------------
  const labels = {
  hi: {
    title: "दान प्रविष्टि",
    name: "नाम",
    address: "पता",
    mobile: "मोबाइल नंबर",
    purpose: "दान का उद्देश्य",
    amount: "राशि",
    gotra: "गोत्र",
    save: "दान सहेजें",
  },
  en: {
    title: "Donation Entry",
    name: "Name",
    address: "Address",
    mobile: "Mobile Number",
    purpose: "Purpose",
    amount: "Amount",
    gotra: "Gotra",
    save: "Save Donation",
  },
};
const t = labels[language];

  const handleSaveAndPrint = async () => {
  setError("");
  setSuccess("");

  try {
    setLoading(true);

    const payload = {
      donorName: form.donorName,
      address: form.address,
      mobile: form.mobile,
      purposeId: form.purposeId,
      amount:
        selectedPurpose?.fixedAmount != null
          ? selectedPurpose.fixedAmount
          : form.amount,
      gotraId: requiresGotra ? form.gotraId : null,
    };

    const blob = await createDonationAndPrint(
      payload,
      auth.username
    );

    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url);

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    setSuccess("Donation saved successfully!");

    // reset form
    setForm({
      donorName: "",
      address: "",
      mobile: "",
      purposeId: "",
      amount: "",
      gotraId: "",
    });

  } catch (e) {
    console.error("Save & Print failed:", e);
    setError(
      e.response?.data?.message || "Failed to save and print donation"
    );
  } finally {
    setLoading(false);
  }
};




  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <LanguageToggle value={language} onChange={setLanguage} />
    </div>

      <h2>{t.title}</h2>

      

      <TextField
        fullWidth
        label={t.name}
        name="donorName"
        value={form.donorName}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label={t.address}
        name="address"
        value={form.address}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label={t.mobile}
        name="mobile"
        value={form.mobile}
        onChange={handleChange}
        margin="normal"
      />

      {/* Purpose */}
      <FormControl fullWidth margin="normal">
        <InputLabel>{t.purpose}</InputLabel>
        <Select
          name="purposeId"
          value={form.purposeId}
          label={t.purpose}
          onChange={handleChange}
        >
          {metadata.purposes.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {language === "hi" ? p.nameHi : p.nameEn}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Amount */}
      <TextField
        fullWidth
        label={t.amount}
        name="amount"
        value={form.amount}
        onChange={handleChange}
        margin="normal"
        disabled={selectedPurpose?.fixedAmount != null}
      />

      {/* Gotra */}
      {requiresGotra && (
        <FormControl fullWidth margin="normal">
          <InputLabel>{t.gotra}</InputLabel>
          <Select
            name="gotraId"
            value={form.gotraId}
            label="Gotra"
            onChange={handleChange}
          >
            {metadata.gotras.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {language === "hi" ? g.nameHi : g.nameEn}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSubmit}
        style={{ marginTop: 16 }}
      >
        Save Donation
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleSaveAndPrint}
      >
        {loading ? "Processing..." : "Save & Print"}
      </Button>


      {/* Success */}
      <Snackbar
        open={!!success}
        autoHideDuration={20000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {/* Error */}
      {error && (
        <Alert severity="error" style={{ marginTop: 16 }}>
          {error}
        </Alert>
      )}
    </div>
  );
}
