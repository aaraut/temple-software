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

export default function DashboardTab() {
  const [occupancy, setOccupancy] = useState(null);

  useEffect(() => {
    loadOccupancy();
  }, []);

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
      <Typography variant="h6" gutterBottom>
        Bhakt Niwas Dashboard
      </Typography>

      {/* Occupancy Section */}
      {occupancy && (
        <>
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography>Total Rooms</Typography>
              <Typography variant="h4">
                {occupancy.totalRooms}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography>Occupied Rooms</Typography>
              <Typography variant="h4">
                {occupancy.occupiedRooms}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography>Occupancy %</Typography>
              <Typography variant="h4">
                {occupancy.occupancyPercentage.toFixed(2)}%
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={occupancy.occupancyPercentage}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Divider sx={{ my: 4 }} />
        </>
      )}

      {/* Calendar Section */}
      <Typography variant="h6" gutterBottom>
        Booking Calendar
      </Typography>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        height="auto"
      />
    </Paper>
  );
}