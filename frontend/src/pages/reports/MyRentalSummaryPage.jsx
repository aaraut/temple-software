import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";
import { getMyRentalSummary } from "../../api/rentalReportApi";
import { useAuth } from "../../context/AuthContext";
import ReportFilters from "../../components/reports/ReportFilters";

export default function MyRentalSummaryPage() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: ""
  });

  useEffect(() => {
    getMyRentalSummary({
      createdBy: auth.username,
      ...filters
    }).then((r) => setData(r.data));
  }, [filters]);

  if (!data) return null;

  const Stat = ({ label, value }) => (
    <Card>
      <CardContent>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="h6">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Typography variant="h5" gutterBottom>
        मेरी किराया रिपोर्ट
      </Typography>

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        showCategory={false}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Stat label="कुल किराये" value={data.totalRentals} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stat label="कुल आय" value={data.totalChargedAmount} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stat label="जमा राशि" value={data.depositCollected} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stat label="कुल छूट" value={data.totalDiscountAmount} />
        </Grid>
      </Grid>
    </>
  );
}
