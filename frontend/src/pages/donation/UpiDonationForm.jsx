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

import { getDonationFormMetadata, searchDonations } from "../../api/donationApi";
import { createUpiDonationAndPrint } from "../../api/upiDonationApi";

import { useAuth } from "../../context/AuthContext";

const DEFAULT_ADDRESS_EN = "Nagpur / Chhindwara";
const DEFAULT_ADDRESS_HI = "नागपुर / छिंदवाड़ा";

export default function UpiDonationForm() {
  const { auth, language } = useAuth();

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  const [autoFilled, setAutoFilled] = useState(false);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    donorName: "",
    address: DEFAULT_ADDRESS_EN,
    mobile: "",
    purposeId: "",
    amount: "",
    gotraId: "",
    paymentRefLast4: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getDonationFormMetadata();
        setMetadata(data);
      } catch {
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
      const defaultGotra = metadata.gotras?.find((g) => g.nameEn?.toLowerCase().startsWith("kashyap"));
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

  useEffect(() => {
    if (!selectedPurpose) return;
    setForm((f) => ({
      ...f,
      amount: selectedPurpose.fixedAmount != null ? selectedPurpose.fixedAmount : "",
    }));
  }, [selectedPurpose]);

  useEffect(() => {
    if (!requiresGotra || !metadata?.gotras) return;
    setForm((f) => {
      if (f.gotraId) return f;
      const defaultGotra = metadata.gotras.find((g) => g.nameEn?.toLowerCase().startsWith("kashyap"));
      return defaultGotra ? { ...f, gotraId: defaultGotra.id } : f;
    });
  }, [requiresGotra, metadata]);

  const handleMobileBlur = async () => {
    if (!form.mobile || form.mobile.length !== 10) return;
    try {
      setSearching(true);
      const res = await searchDonations({ mobile: form.mobile });
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        const restoredGotra = latest.gotraId
          || (requiresGotra
            ? metadata?.gotras?.find((g) => g.nameEn?.toLowerCase().startsWith("kashyap"))?.id || ""
            : "");
        setForm((prev) => ({
          ...prev,
          donorName: latest.donorName || "",
          address: latest.address || DEFAULT_ADDRESS_EN,
          gotraId: restoredGotra || prev.gotraId,
        }));
        setAutoFilled(true);
      } else {
        setAutoFilled(false);
      }
    } catch {
      // silent — autofill is a convenience, not required
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "mobile") setAutoFilled(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRefChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setForm({ ...form, paymentRefLast4: digits });
  };

  const handleReset = () => {
    setForm({
      donorName: "",
      address: DEFAULT_ADDRESS_EN,
      mobile: "",
      purposeId: "",
      amount: "",
      gotraId: "",
      paymentRefLast4: "",
    });
    setAutoFilled(false);
  };

  const displayAddress =
    language === "hi" && form.address === DEFAULT_ADDRESS_EN
      ? DEFAULT_ADDRESS_HI
      : form.address;

  const handleAddressChange = (e) => {
    const val = e.target.value;
    const toStore = val === DEFAULT_ADDRESS_HI ? DEFAULT_ADDRESS_EN : val;
    setForm({ ...form, address: toStore });
  };

  const handleSaveAndPrint = async () => {
    setError("");
    setSuccess("");

    if (requiresGotra && !form.gotraId) {
      setError(language === "hi" ? "कृपया गोत्र चुनें" : "Please select a Gotra");
      return;
    }
    if (form.paymentRefLast4.length !== 4) {
      setError(language === "hi"
        ? "कृपया भुगतान संदर्भ के अंतिम 4 अंक दर्ज करें"
        : "Please enter the last 4 digits of the payment reference");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        donorName: form.donorName,
        address: form.address,
        mobile: form.mobile,
        purposeId: form.purposeId,
        amount: selectedPurpose?.fixedAmount != null ? selectedPurpose.fixedAmount : form.amount,
        gotraId: requiresGotra ? form.gotraId : null,
        paymentRefLast4: form.paymentRefLast4,
      };

      const blob = await createUpiDonationAndPrint(payload, auth.username, language);
      const blobUrl = URL.createObjectURL(blob);

      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
      }

      setSuccess(language === "hi" ? "यूपीआई बिल सेव हो गया!" : "UPI bill saved successfully!");
      handleReset();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save UPI donation bill");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  const labels = {
    hi: {
      title: "यूपीआई दान बिल",
      name: "नाम",
      address: "पता",
      mobile: "मोबाइल नंबर",
      purpose: "दान का उद्देश्य",
      amount: "राशि",
      gotra: "गोत्र",
      refLast4: "भुगतान संदर्भ के अंतिम 4 अंक",
      saveAndPrint: "सेव और प्रिंट करें",
      reset: "कैंसल",
    },
    en: {
      title: "UPI Donation Bill",
      name: "Name",
      address: "Address",
      mobile: "Mobile Number",
      purpose: "Purpose",
      amount: "Amount",
      gotra: "Gotra",
      refLast4: "Last 4 digits of payment reference number",
      saveAndPrint: "Save & Print",
      reset: "Cancel",
    },
  };
  const t = labels[language];

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Card sx={{ width: 550, borderRadius: 3, boxShadow: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600}>{t.title}</Typography>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t.purpose}</InputLabel>
            <Select name="purposeId" value={form.purposeId} label={t.purpose} onChange={handleChange}>
              {metadata.purposes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {language === "hi" ? p.nameHi : p.nameEn}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth label={t.mobile} name="mobile" value={form.mobile}
            onChange={handleChange} onBlur={handleMobileBlur}
            inputProps={{ maxLength: 10 }} margin="normal"
            InputProps={{ endAdornment: searching && <CircularProgress size={18} /> }}
          />

          {autoFilled && (
            <Typography variant="caption" color="success.main">
              {language === "hi" ? "✔ पिछले दान से स्वतः भरा गया" : "✔ Auto-filled from last donation"}
            </Typography>
          )}

          <TextField fullWidth label={t.name} name="donorName" value={form.donorName} onChange={handleChange} margin="normal" />

          {requiresGotra && (
            <FormControl fullWidth margin="normal">
              <InputLabel>{t.gotra}</InputLabel>
              <Select name="gotraId" value={form.gotraId} label={t.gotra} onChange={handleChange}>
                {metadata.gotras.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{language === "hi" ? g.nameHi : g.nameEn}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField fullWidth label={t.address} name="address" value={displayAddress} onChange={handleAddressChange} margin="normal" />

          <TextField
            fullWidth label={t.amount} name="amount" value={form.amount} onChange={handleChange}
            margin="normal" disabled={selectedPurpose?.fixedAmount != null}
          />

          <TextField
            fullWidth label={t.refLast4} name="paymentRefLast4" value={form.paymentRefLast4}
            onChange={handleRefChange} inputProps={{ maxLength: 4, inputMode: "numeric" }}
            margin="normal" placeholder="XXXX"
          />

          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" fullWidth onClick={handleSaveAndPrint}>{t.saveAndPrint}</Button>
            <Button variant="outlined" fullWidth onClick={handleReset}>{t.reset}</Button>
          </Box>

          <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess("")}>
            <Alert severity="success">{success}</Alert>
          </Snackbar>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
}
