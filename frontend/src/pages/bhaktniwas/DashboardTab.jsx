import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Paper } from "@mui/material";

export default function DashboardTab() {
  return (
    <Paper sx={{ p: 3 }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        height="auto"
      />
    </Paper>
  );
}