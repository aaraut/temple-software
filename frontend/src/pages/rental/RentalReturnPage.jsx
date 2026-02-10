import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Snackbar,
  Alert
} from "@mui/material";
import { getRentalByReceipt, issueRental } from "../../api/rentalApi";
import { returnRental } from "../../api/rentalApi";
import { useAuth } from "../../context/AuthContext";
import LanguageToggle from "../../components/LanguageToggle";
import RentalReturnTable from "../../components/rental/RentalReturnTable";
import RentalSummaryCard from "../../components/rental/RentalSummaryCard";

const labels = {
  hi: {
    title: "किराया वापसी",
    receipt: "रसीद नंबर",
    search: "खोजें",
    fine: "जुर्माना / नुकसान राशि",
    remarks: "टिप्पणी",
    submit: "वापसी दर्ज करें",
    notFound: "रसीद नहीं मिली"
  },
  en: {
    title: "Rental Return",
    receipt: "Receipt Number",
    search: "Search",
    fine: "Fine / Loss Amount",
    remarks: "Remarks",
    submit: "Submit Return",
    notFound: "Receipt not found"
  }
};

export default function RentalReturnPage() {
  const { auth } = useAuth();
  const [language, setLanguage] = useState("hi");
  const t = labels[language];

  const [receiptNumber, setReceiptNumber] = useState("");
  const [rental, setRental] = useState(null);

  const [returnItems, setReturnItems] = useState({});
  const [fineAmount, setFineAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const searchRental = async () => {
    setError("");
    try {
      const resp = await getRentalByReceipt(receiptNumber);
      setRental(resp.data);
      setReturnItems({});
    } catch {
      setError(t.notFound);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        receiptNumber,
        fineAmount: fineAmount || 0,
        remarks,
        handledBy: auth.username,
        items: Object.values(returnItems)
      };

      await returnRental(payload);
      setSuccess("वापसी सफलतापूर्वक दर्ज हुई");
      setRental(null);
    } catch (e) {
      setError(e.response?.data?.message || "वापसी में त्रुटि");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <LanguageToggle value={language} onChange={setLanguage} />
      </Box>

      <h2>{t.title}</h2>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label={t.receipt}
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
        />
        <Button variant="contained" onClick={searchRental}>
          {t.search}
        </Button>
      </Box>

      {rental && (
        <>
          {/* <h3>
            {rental.category === "BARTAN" ? "बर्तन" : "बिछायत"}
          </h3> */}
          <RentalSummaryCard rental={rental} />

          <RentalReturnTable
            rental={rental}
            onChange={setReturnItems}
          />

          <TextField
            fullWidth
            label={t.fine}
            value={fineAmount}
            onChange={(e) => setFineAmount(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label={t.remarks}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            margin="normal"
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            {t.submit}
          </Button>
        </>
      )}

      <Snackbar open={!!success} autoHideDuration={12000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
