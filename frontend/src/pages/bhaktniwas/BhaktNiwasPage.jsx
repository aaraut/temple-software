import { useState } from "react";
import { Tabs, Tab, Box, Paper } from "@mui/material";
import RoomInventoryPage from "../room/RoomInventoryPage";
import BookingTab from "./BookingTab";
import ReportsTab from "./ReportsTab";
import DashboardTab from "./DashboardTab";
import { useAuth } from "../../context/AuthContext";

const TAB_LABELS = {
  en: ["Inventory", "Booking", "Reports", "Dashboard"],
  hi: ["सूची", "बुकिंग", "रिपोर्ट", "डैशबोर्ड"],
};

export default function BhaktNiwasPage() {
  const [tab, setTab] = useState(0);
  const { language } = useAuth();
  const labels = TAB_LABELS[language] ?? TAB_LABELS.en;

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          variant="scrollable"
        >
          {labels.map((label, idx) => (
            <Tab key={idx} label={label} />
          ))}
        </Tabs>
      </Paper>

      {tab === 0 && <RoomInventoryPage language={language} />}
      {tab === 1 && <BookingTab language={language} />}
      {tab === 2 && <ReportsTab language={language} />}
      {tab === 3 && <DashboardTab language={language} />}
    </Box>
  );
}
