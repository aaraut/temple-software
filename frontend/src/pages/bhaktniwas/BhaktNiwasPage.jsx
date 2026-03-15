import { useState } from "react";
import { Tabs, Tab, Box, Paper } from "@mui/material";
import RoomInventoryPage from "../room/RoomInventoryPage";
import BookingTab from "./BookingTab";
import ReportsTab from "./ReportsTab";
import DashboardTab from "./DashboardTab";

export default function BhaktNiwasPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          variant="scrollable"
        >
          <Tab label="Inventory" />
          <Tab label="Booking" />
          <Tab label="Reports" />
          <Tab label="Dashboard" />
        </Tabs>
      </Paper>

      {tab === 0 && <RoomInventoryPage />}
      {tab === 1 && <BookingTab />}
      {tab === 2 && <ReportsTab />}
      {tab === 3 && <DashboardTab />}
    </Box>
  );
}