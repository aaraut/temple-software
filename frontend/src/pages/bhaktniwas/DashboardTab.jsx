import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Divider,
  Box,
} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getOccupancy } from "../../api/roomBookingApi";

const L = {
  en: {
    title: "Bhakt Niwas Dashboard",
    totalRooms: "Total Rooms",
    occupiedRooms: "Occupied Rooms",
    occupancyPct: "Occupancy %",
    calendar: "Booking Calendar",
  },
  hi: {
    title: "भक्त निवास डैशबोर्ड",
    totalRooms: "कुल कमरे",
    occupiedRooms: "भरे हुए कमरे",
    occupancyPct: "अधिभोग %",
    calendar: "बुकिंग कैलेंडर",
  },
};

export default function DashboardTab({ language = "hi" }) {
  const [occupancy, setOccupancy] = useState(null);
  const t = L[language] ?? L.en;

  useEffect(() => { loadOccupancy(); }, []);

  const loadOccupancy = async () => {
    try {
      const res = await getOccupancy();
      setOccupancy(res.data);
    } catch (err) {
      console.error("Failed to load occupancy");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t.title}</Typography>

      {occupancy && (
        <>
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography>{t.totalRooms}</Typography>
              <Typography variant="h4">{occupancy.totalRooms}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>{t.occupiedRooms}</Typography>
              <Typography variant="h4">{occupancy.occupiedRooms}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>{t.occupancyPct}</Typography>
              <Typography variant="h4">{occupancy.occupancyPercentage.toFixed(2)}%</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={occupancy.occupancyPercentage} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
          <Divider sx={{ my: 4 }} />
        </>
      )}

      <Typography variant="h6" gutterBottom>{t.calendar}</Typography>
      <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" height="auto" />
    </Paper>
  );
}
