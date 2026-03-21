import { Paper, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const L = {
  en: {
    name: "Name", mobile: "Mobile", address: "Address",
    category: "Category", deposit: "Deposit", fine: "Fine",
    bartan: "Bartan", bichayat: "Bichayat",
  },
  hi: {
    name: "नाम", mobile: "मोबाइल", address: "पता",
    category: "श्रेणी", deposit: "जमा", fine: "जुर्माना",
    bartan: "बर्तन", bichayat: "बिछायत",
  },
};

export default function RentalSummaryCard({ rental }) {
  const { language } = useAuth();
  const t = L[language] ?? L.en;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", borderRadius: 2 }}>
      <Typography><b>{t.name}:</b> {rental.customerName}</Typography>
      <Typography><b>{t.mobile}:</b> {rental.mobile}</Typography>
      <Typography><b>{t.address}:</b> {rental.address}</Typography>
      <Typography><b>{t.category}:</b> {rental.category === "BARTAN" ? t.bartan : t.bichayat}</Typography>
      <Typography><b>{t.deposit}:</b> ₹{rental.depositAmount}</Typography>
      <Typography><b>{t.fine}:</b> ₹{rental.totalFineAmount}</Typography>
    </Paper>
  );
}
