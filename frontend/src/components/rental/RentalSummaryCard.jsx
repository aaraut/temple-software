import { Paper, Grid, Typography } from "@mui/material";

export default function RentalSummaryCard({ rental }) {
  return (
    <Paper sx={{ p: 2, mt: 2, backgroundColor: "#fafafa" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        किराया विवरण
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography><b>नाम:</b> {rental.customerName}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography><b>मोबाइल:</b> {rental.mobile}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography><b>पता:</b> {rental.address}</Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography>
            <b>श्रेणी:</b>{" "}
            {rental.category === "BARTAN" ? "बर्तन" : "बिछायत"}
          </Typography>
        </Grid>

        <Grid item xs={4}>
          <Typography>
            <b>जमा राशि:</b> ₹{rental.depositAmount}
          </Typography>
        </Grid>

        <Grid item xs={4}>
          <Typography>
            <b>अब तक का जुर्माना:</b> ₹{rental.totalFineAmount}
          </Typography>
        </Grid>

        <Grid item xs={4}>
          <Typography>
            <b>स्थिति:</b> {rental.status}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
