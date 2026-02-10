import { Paper, Typography } from "@mui/material";

export default function RentalSummaryCard({ rental }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        alignItems: "center",
        borderRadius: 2
      }}
    >
      <Typography><b>नाम:</b> {rental.customerName}</Typography>
      <Typography><b>मोबाइल:</b> {rental.mobile}</Typography>
      <Typography><b>पता:</b> {rental.address}</Typography>
      <Typography>
        <b>श्रेणी:</b> {rental.category === "BARTAN" ? "बर्तन" : "बिछायत"}
      </Typography>
      <Typography><b>जमा:</b> ₹{rental.depositAmount}</Typography>
      <Typography><b>जुर्माना:</b> ₹{rental.totalFineAmount}</Typography>
    </Paper>
  );
}
