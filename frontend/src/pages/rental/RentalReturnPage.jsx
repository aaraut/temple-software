import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Snackbar,
  Alert,
  Paper,
  Typography,
  Divider
} from "@mui/material";
import { getRentalByReceipt, returnRentalAndPrint } from "../../api/rentalApi";
import { useAuth } from "../../context/AuthContext";
import LanguageToggle from "../../components/LanguageToggle";
import RentalReturnTable from "../../components/rental/RentalReturnTable";
import RentalSummaryCard from "../../components/rental/RentalSummaryCard";
const labels = {
  hi: {
    title: "किराया वापसी",
    receipt: "रसीद नंबर",
    search: "खोजें",
    fine: "जुर्माना / नुकसान",
    remarks: "टिप्पणी",
    submit: "वापसी दर्ज करें",
    notFound: "रसीद नहीं मिली",
    successReturn: "वापसी सफलतापूर्वक दर्ज हुई",
    errorReturn: "वापसी में त्रुटि"
  },
  en: {
    title: "Rental Return",
    receipt: "Receipt Number",
    search: "Search",
    fine: "Fine / Loss",
    remarks: "Remarks",
    submit: "Submit Return",
    notFound: "Receipt not found",
    successReturn: "Return submitted successfully",
    errorReturn: "Error in return submission"
  }
};


export default function RentalReturnPage() {
  const { auth } = useAuth();
  const [language, setLanguage] = useState("hi");

  const [receiptNumber, setReceiptNumber] = useState("");
  const [rental, setRental] = useState(null);

  const [returnItems, setReturnItems] = useState({});
  const [fineAmount, setFineAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const t = labels[language];

  const searchRental = async () => {
    setError("");
    try {
      const resp = await getRentalByReceipt(receiptNumber.trim());
      setRental(resp);
      setReturnItems({});
    } catch {
      setRental(null);
      setError(t.notFound);
    }
  };

  const handleSubmit = async () => {
    try {
      const pdfBlob = await returnRentalAndPrint(
        {
          receiptNumber,
          fineAmount: fineAmount || 0,
          remarks,
          handledBy: auth.username,
          items: Object.values(returnItems)
        },
        auth.username
      );

      // Open PDF in new tab
      const file = new Blob([pdfBlob], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(file);
      window.open(fileURL);

      setSuccess(t.successReturn);
      setRental(null);
      setReceiptNumber("");
    } catch (e) {
      setError(e.response?.data?.message || t.errorReturn);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      {/* Top bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t.title}
        </Typography>
        <LanguageToggle value={language} onChange={setLanguage} />
      </Box>

      {/* Search */}
      <Paper
        sx={{
          p: 1.5,
          display: "flex",
          gap: 2,
          alignItems: "center",
          borderRadius: 2
        }}
        variant="outlined"
      >
        <TextField
          size="small"
          label={t.receipt}
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
        />
        <Button size="small" variant="contained" onClick={searchRental}>
          {t.search}
        </Button>
      </Paper>

      {rental && (
        <>
          <Divider sx={{ my: 2 }} />

          {/* Compact summary */}
          <RentalSummaryCard rental={rental} />

          {/* Table */}
          <Box sx={{ mt: 2 }}>
            <RentalReturnTable rental={rental} onChange={setReturnItems} language={language} />
          </Box>

          {/* Fine & submit */}
          <Paper
            sx={{
              mt: 2,
              p: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              alignItems: "center"
            }}
            variant="outlined"
          >
            <TextField
              size="small"
              label={t.fine}
              type="number"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
            />

            <TextField
              size="small"
              label={t.remarks}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <Box sx={{ gridColumn: "1 / -1", textAlign: "right" }}>
              <Button size="small" variant="contained" onClick={handleSubmit}>
                {t.submit}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      <Snackbar open={!!success} autoHideDuration={8000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
