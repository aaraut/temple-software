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
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";

import {
  getDonationFormMetadata,
  createDonationAndPrint,
  searchDonations
} from "../../api/donationApi";

import { useAuth } from "../../context/AuthContext";
import LanguageToggle from "../../components/LanguageToggle";

// FIX 1: Default address in both languages.
// Backend always stores English. Form shows Hindi when language = "hi".
const DEFAULT_ADDRESS_EN = "Nagpur / Chhindwara";
const DEFAULT_ADDRESS_HI = "नागपुर / छिंदवाड़ा";

export default function DonationForm() {
  const { auth } = useAuth();

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("hi");

  const [autoFilled, setAutoFilled] = useState(false);
  const [mobileMatches, setMobileMatches] = useState([]);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    donorName: "",
    address: DEFAULT_ADDRESS_EN,   // always stored in English internally
    mobile: "",
    purposeId: "",
    amount: "",
    gotraId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ================= LOAD METADATA =================
  useEffect(() => {
    async function load() {
      try {
        const data = await getDonationFormMetadata();
        console.log("GOTRAS FROM API:", JSON.stringify(data.gotras));
        setMetadata(data);
      } catch (e) {
        setError("Failed to load donation metadata");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
  if (!metadata?.purposes) return;

  const defaultPurpose = metadata.purposes.find(
    (p) => p.nameEn === "Sankalp Abhishek"
  );

  if (defaultPurpose) {
    // Jackson serialises boolean isDefault as "default" in JSON
    const defaultGotra = metadata.gotras?.find((g) => g.nameEn?.toLowerCase() === "kashyap");
    setForm((prev) => ({
      ...prev,
      purposeId: defaultPurpose.id,
      gotraId: defaultPurpose.requiresGotra && defaultGotra
        ? defaultGotra.id
        : prev.gotraId,
    }));
  }
}, [metadata]);

  const selectedPurpose = metadata?.purposes.find(
    (p) => p.id === Number(form.purposeId)
  );

  const requiresGotra = selectedPurpose?.requiresGotra;

  // Fixed amount logic
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

  // FIX 2b: When user manually switches to a purpose that requires gotra,
  // auto-select Kashyap if nothing is already selected.
  useEffect(() => {
    if (!requiresGotra || !metadata?.gotras) return;

    setForm((f) => {
      if (f.gotraId) return f; // already selected, don't override
      const defaultGotra = metadata.gotras.find((g) => g.nameEn?.toLowerCase() === "kashyap");
      return defaultGotra ? { ...f, gotraId: defaultGotra.id } : f;
    });
  }, [requiresGotra, metadata]);

  // ================= MOBILE AUTO SEARCH =================
  const handleMobileBlur = async () => {
    if (!form.mobile || form.mobile.length !== 10) return;

    try {
      setSearching(true);

      const res = await searchDonations({
        mobile: form.mobile,
      });

      if (res.data && res.data.length > 0) {
        setMobileMatches(res.data);

        const latest = res.data[0];

        // Restore gotraId from the previous donation if available,
        // otherwise fall back to Kashyap when purpose requires gotra.
        const restoredGotra = latest.gotraId
          || (requiresGotra
            ? metadata?.gotras?.find((g) => g.nameEn?.toLowerCase() === "kashyap")?.id || ""
            : "");

        setForm((prev) => ({
          ...prev,
          donorName: latest.donorName || "",
          address: latest.address || DEFAULT_ADDRESS_EN,
          gotraId: restoredGotra || prev.gotraId,
        }));

        setAutoFilled(true);
      } else {
        setMobileMatches([]);
        setAutoFilled(false);
      }
    } catch (err) {
      console.error("Mobile auto fetch failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleDonorSelect = (event) => {
    const selectedId = event.target.value;

    const selected = mobileMatches.find((d) => d.id === selectedId);

    if (selected) {
      setForm((prev) => ({
        ...prev,
        donorName: selected.donorName || "",
        address: selected.address || DEFAULT_ADDRESS_EN,
      }));
      setAutoFilled(true);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "mobile") {
      setAutoFilled(false);
      setMobileMatches([]);
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm({
      donorName: "",
      address: DEFAULT_ADDRESS_EN,
      mobile: "",
      purposeId: "",
      amount: "",
      gotraId: "",
    });
    setAutoFilled(false);
    setMobileMatches([]);
  };

  // FIX 1: Show Hindi address on form when in Hindi mode,
  // but keep form.address in English so backend always gets English.
  const displayAddress =
    language === "hi" && form.address === DEFAULT_ADDRESS_EN
      ? DEFAULT_ADDRESS_HI
      : form.address;

  const handleAddressChange = (e) => {
    const val = e.target.value;
    // If user types the Hindi default back, normalise to English for storage
    const toStore = val === DEFAULT_ADDRESS_HI ? DEFAULT_ADDRESS_EN : val;
    setForm({ ...form, address: toStore });
  };

  const handleSaveAndPrint = async () => {
    setError("");
    setSuccess("");

    // FIX 3: Validate gotra on the frontend before calling the backend,
    // so the error message shows clearly in the UI.
    if (requiresGotra && !form.gotraId) {
      setError(
        language === "hi"
          ? "कृपया गोत्र चुनें"
          : "Please select a Gotra"
      );
      return;
    }

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

      const blob = await createDonationAndPrint(payload, auth.username);

      const blobUrl = URL.createObjectURL(blob);

      // Open the PDF blob URL directly in a new tab.
      // Previously this used an <iframe> which caused the PDF viewer to
      // render as a black rectangle when printed. Opening the blob URL
      // directly lets the browser print the actual PDF content.
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
      }

      setSuccess("Donation saved successfully!");
      handleReset();

    } catch (e) {
      setError(e.response?.data?.message || "Failed to save donation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  const labels = {
    hi: {
      title: "दान प्रविष्टि",
      name: "नाम",
      address: "पता",
      mobile: "मोबाइल नंबर",
      purpose: "दान का उद्देश्य",
      amount: "राशि",
      gotra: "गोत्र",
    },
    en: {
      title: "Donation Entry",
      name: "Name",
      address: "Address",
      mobile: "Mobile Number",
      purpose: "Purpose",
      amount: "Amount",
      gotra: "Gotra",
    },
  };

  const t = labels[language];

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Card sx={{ width: 550, borderRadius: 3, boxShadow: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600}>
              {t.title}
            </Typography>
            <LanguageToggle value={language} onChange={setLanguage} />
          </Box>

          {/* PURPOSE */}
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

          {/* MOBILE */}
          <TextField
            fullWidth
            label={t.mobile}
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            onBlur={handleMobileBlur}
            inputProps={{ maxLength: 10 }}
            margin="normal"
            InputProps={{
              endAdornment: searching && <CircularProgress size={18} />
            }}
          />

          {/* MULTIPLE MATCH DROPDOWN */}
          {/* {mobileMatches.length > 1 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Previous Donor</InputLabel>
              <Select onChange={handleDonorSelect}>
                {mobileMatches.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.donorName} ({new Date(d.createdAt).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )} */}

          {autoFilled && (
            <Typography variant="caption" color="success.main">
              {language === "hi" ? "✔ पिछले दान से स्वतः भरा गया" : "✔ Auto-filled from last donation"}
            </Typography>
          )}

          {/* NAME */}
          <TextField
            fullWidth
            label={t.name}
            name="donorName"
            value={form.donorName}
            onChange={handleChange}
            margin="normal"
          />
          {/* GOTRA */}
          {requiresGotra && (
            <FormControl fullWidth margin="normal">
              <InputLabel>{t.gotra}</InputLabel>
              <Select
                name="gotraId"
                value={form.gotraId}
                label={t.gotra}
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

          {/* ADDRESS */}
          <TextField
            fullWidth
            label={t.address}
            name="address"
            value={displayAddress}
            onChange={handleAddressChange}
            margin="normal"
          />

          {/* AMOUNT */}
          <TextField
            fullWidth
            label={t.amount}
            name="amount"
            value={form.amount}
            onChange={handleChange}
            margin="normal"
            disabled={selectedPurpose?.fixedAmount != null}
          />

          {/* ACTION BUTTONS */}
          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" fullWidth onClick={handleSaveAndPrint}>
              Save & Print
            </Button>
            <Button variant="outlined" fullWidth onClick={handleReset}>
              Reset
            </Button>
          </Box>

          <Snackbar
            open={!!success}
            autoHideDuration={5000}
            onClose={() => setSuccess("")}
          >
            <Alert severity="success">{success}</Alert>
          </Snackbar>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
 );
}
