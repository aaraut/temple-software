import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  IconButton,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import TranslateIcon from "@mui/icons-material/Translate";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

// All nav labels in both languages
const NAV = {
  home:              { en: "Home",              hi: "होम" },
  donation:          { en: "Donation",          hi: "दान" },
  master:            { en: "Master",            hi: "मास्टर" },
  bartan:            { en: "Bartan",            hi: "बर्तन" },
  bichayat:          { en: "Bichayat",          hi: "बिछायत" },
  gotra:             { en: "Gotra",             hi: "गोत्र" },
  donationPurpose:   { en: "Donation Purpose",  hi: "दान उद्देश्य" },
  rental:            { en: "Rental",            hi: "किराया" },
  returnRental:      { en: "Return Rental",     hi: "किराया वापसी" },
  reports:           { en: "Reports",           hi: "रिपोर्ट" },
  myEntries:         { en: "My Rental Entries", hi: "मेरी किराया प्रविष्टियाँ" },
  myRentalSummary:   { en: "My Rental Summary", hi: "मेरी किराया सारांश" },
  pendingRentals:    { en: "Pending Rentals",   hi: "लंबित किराया" },
  adminRental:       { en: "Rental Admin Summary", hi: "किराया एडमिन सारांश" },
  bhaktNiwas:        { en: "Bhakt Niwas",       hi: "भक्त निवास" },
  bhaktNiwasDash:    { en: "Bhakt Niwas Dashboard", hi: "भक्त निवास डैशबोर्ड" },
  roomInventory:     { en: "Room Inventory",    hi: "कमरा सूची" },
  roomBooking:       { en: "Room Booking",      hi: "कमरा बुकिंग" },
  users:             { en: "Users",             hi: "यूज़र मैनेजमेंट" },
  changePassword:    { en: "Change Password",   hi: "पासवर्ड बदलें" },
  logout:            { en: "Logout",            hi: "लॉगआउट" },
};

export default function Header() {
  const { auth, logout, language, setLanguage } = useAuth();
  const navigate = useNavigate();

  const [donationAnchor, setDonationAnchor] = useState(null);
  const [inventoryAnchor, setInventoryAnchor] = useState(null);
  const [rentalAnchor, setRentalAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [reportAnchor, setReportAnchor] = useState(null);
  const [roomAnchor, setRoomAnchor] = useState(null);

  if (!auth) return null;

  const t = (key) => NAV[key]?.[language] ?? NAV[key]?.en ?? key;

  const isAdmin = auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  const openDonation  = Boolean(donationAnchor);
  const openInventory = Boolean(inventoryAnchor);
  const openRental    = Boolean(rentalAnchor);
  const openProfile   = Boolean(profileAnchor);
  const openReport    = Boolean(reportAnchor);
  const openRoom      = Boolean(roomAnchor);

  return (
    <AppBar position="static" sx={{ backgroundColor: "#7a1f1f" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>

        {/* Logo */}
        <Typography
          variant="h6"
          sx={{ cursor: "pointer", fontWeight: 600, fontSize: { xs: "0.85rem", md: "1rem" } }}
          onClick={() => navigate("/")}
        >
          🛕 {language === "hi" ? "चमत्कारिक श्री हनुमान मंदिर जामसावली" : "Chamatkarik Shree Hanuman Mandir Jamsawli"}
        </Typography>

        {/* Main Menu */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>

          <Button color="inherit" onClick={() => navigate("/")} sx={{ fontSize: "0.82rem" }}>
            {t("home")}
          </Button>

          <Button color="inherit" onClick={() => navigate("/donation")} sx={{ fontSize: "0.82rem" }}>
            {t("donation")}
          </Button>

          {/* Master Dropdown */}
          <Button color="inherit" endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setInventoryAnchor(e.currentTarget)} sx={{ fontSize: "0.82rem" }}>
            {t("master")}
          </Button>
          <Menu anchorEl={inventoryAnchor} open={openInventory} onClose={() => setInventoryAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}>
            <MenuItem onClick={() => { setInventoryAnchor(null); navigate("/inventory/bartan"); }}>{t("bartan")}</MenuItem>
            <MenuItem onClick={() => { setInventoryAnchor(null); navigate("/inventory/bichayat"); }}>{t("bichayat")}</MenuItem>
            <MenuItem onClick={() => { setInventoryAnchor(null); navigate("/gotra"); }}>{t("gotra")}</MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { setInventoryAnchor(null); navigate("/master/donation-purpose"); }}>{t("donationPurpose")}</MenuItem>
            )}
          </Menu>

          {/* Rental Dropdown */}
          <Button color="inherit" endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setRentalAnchor(e.currentTarget)} sx={{ fontSize: "0.82rem" }}>
            {t("rental")}
          </Button>
          <Menu anchorEl={rentalAnchor} open={openRental} onClose={() => setRentalAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}>
            <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/bartan"); }}>{t("bartan")}</MenuItem>
            <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/bichayat"); }}>{t("bichayat")}</MenuItem>
            <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/return"); }}>{t("returnRental")}</MenuItem>
          </Menu>

          {/* Reports Dropdown */}
          <Button color="inherit" endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setReportAnchor(e.currentTarget)} sx={{ fontSize: "0.82rem" }}>
            {t("reports")}
          </Button>
          <Menu anchorEl={reportAnchor} open={openReport} onClose={() => setReportAnchor(null)}>
            <MenuItem onClick={() => { setReportAnchor(null); navigate("/reports/rentals/my-entries"); }}>{t("myEntries")}</MenuItem>
            <MenuItem onClick={() => { setReportAnchor(null); navigate("/reports/rentals/my"); }}>{t("myRentalSummary")}</MenuItem>
            <MenuItem onClick={() => { setReportAnchor(null); navigate("/reports/rentals/pending"); }}>{t("pendingRentals")}</MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { setReportAnchor(null); navigate("/reports/rentals/admin"); }}>{t("adminRental")}</MenuItem>
            )}
          </Menu>

          {/* Bhakt Niwas Dropdown */}
          <Button color="inherit" endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setRoomAnchor(e.currentTarget)} sx={{ fontSize: "0.82rem" }}>
            {t("bhaktNiwas")}
          </Button>
          <Menu anchorEl={roomAnchor} open={openRoom} onClose={() => setRoomAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}>
            <MenuItem onClick={() => { setRoomAnchor(null); navigate("/bhakt-niwas"); }}>{t("bhaktNiwasDash")}</MenuItem>
            <MenuItem onClick={() => { setRoomAnchor(null); navigate("/inventory/rooms"); }}>{t("roomInventory")}</MenuItem>
            <MenuItem onClick={() => { setRoomAnchor(null); navigate("/rooms/bookings"); }}>{t("roomBooking")}</MenuItem>
          </Menu>

          {isAdmin && (
            <Button color="inherit" onClick={() => navigate("/users")} sx={{ fontSize: "0.82rem" }}>
              {t("users")}
            </Button>
          )}
        </Box>

        {/* Right side: Language Toggle + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

          {/* ── Language Toggle in Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TranslateIcon sx={{ fontSize: "1rem", opacity: 0.8 }} />
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={(_, lang) => lang && setLanguage(lang)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  color: "white",
                  borderColor: "rgba(255,255,255,0.4)",
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(255,255,255,0.25)",
                    color: "white",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }
                }
              }}
            >
              <ToggleButton value="hi">हिंदी</ToggleButton>
              <ToggleButton value="en">EN</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Profile Menu */}
          <IconButton color="inherit" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <AccountCircle />
            <Typography sx={{ ml: 1, fontSize: "0.85rem" }}>
              {auth.username}
            </Typography>
            <ArrowDropDownIcon />
          </IconButton>

          <Menu
            anchorEl={profileAnchor}
            open={openProfile}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={() => { setProfileAnchor(null); navigate("/change-password"); }}>
              {t("changePassword")}
            </MenuItem>
            <MenuItem
              onClick={() => { setProfileAnchor(null); logout(); }}
              sx={{ color: "#7a1f1f", fontWeight: 500 }}
            >
              {t("logout")}
            </MenuItem>
          </Menu>
        </Box>

      </Toolbar>
    </AppBar>
  );
}
