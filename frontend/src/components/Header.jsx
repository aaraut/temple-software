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
  ToggleButtonGroup,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  useMediaQuery,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import TranslateIcon from "@mui/icons-material/Translate";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { MODULE_KEYS, isModuleVisible } from "../constants/modules";

// All nav labels in both languages
const NAV = {
  home:              { en: "Home",              hi: "होम" },
  donation:          { en: "Donation",          hi: "दान" },
  master:            { en: "Master",            hi: "मास्टर" },
  bartan:            { en: "Bartan",            hi: "बर्तन" },
  bichayat:          { en: "Bichayat",          hi: "बिछायत" },
  gotra:             { en: "Gotra",             hi: "गोत्र" },
  donationPurpose:   { en: "Donation Purpose",  hi: "दान उद्देश्य" },
  rental:            { en: "Bichayat Facility",  hi: "बिछायत सुविधा" },
  returnRental:      { en: "Bichayat Return",    hi: "बिछायत वापसी" },
  reports:           { en: "Reports",           hi: "रिपोर्ट" },
  myEntries:         { en: "My Rental Entries", hi: "मेरी किराया एंट्रीज़" },
  myRentalSummary:   { en: "My Rental Summary", hi: "मेरी किराया संक्षिप्त विवरण" },
  pendingRentals:    { en: "Pending Rentals",   hi: "लंबित किराया" },
  adminRental:       { en: "Rental Admin Summary", hi: "किराया एडमिन संक्षिप्त विवरण" },
  bhaktNiwas:        { en: "Bhakt Niwas",       hi: "भक्त निवास" },
  bhaktNiwasDash:    { en: "Bhakt Niwas Dashboard", hi: "भक्त निवास डैशबोर्ड" },
  roomInventory:     { en: "Room Inventory",    hi: "कमरा सूची" },
  roomCategories:    { en: "Room Categories",   hi: "कमरा श्रेणियाँ" },
  roomBooking:       { en: "Room Booking",      hi: "कमरा बुकिंग" },
  bookingSearch:     { en: "Search Bookings",   hi: "बुकिंग खोजें" },
  users:             { en: "Users",             hi: "यूज़र मैनेजमेंट" },
  changePassword:    { en: "Change Password",   hi: "पासवर्ड बदलें" },
  moduleAccess:      { en: "Module Access",     hi: "मॉड्यूल एक्सेस" },
  logout:            { en: "Logout",            hi: "लॉगआउट" },
};

// Path prefixes that belong to each top-level nav item, for active-highlighting
// (a click on a child page — e.g. /rentals/return — should highlight its parent, "rental").
const NAV_ROUTES = {
  home: ["/", "/dashboard"],
  donation: ["/donation"],
  rental: ["/rentals"],
  bhaktNiwas: ["/bhakt-niwas", "/inventory/rooms", "/inventory/room-categories"],
  reports: ["/reports"],
  master: ["/inventory/bartan", "/inventory/bichayat", "/gotra", "/master/donation-purpose"],
  users: ["/users"],
};

function matchesNav(pathname, key) {
  const prefixes = NAV_ROUTES[key] || [];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function Header() {
  const { auth, logout, language, setLanguage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [inventoryAnchor, setInventoryAnchor] = useState(null);
  const [rentalAnchor, setRentalAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [reportAnchor, setReportAnchor] = useState(null);
  const [roomAnchor, setRoomAnchor] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState("");

  if (!auth) return null;

  const t = (key) => NAV[key]?.[language] ?? NAV[key]?.en ?? key;

  const isAdmin = auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  const showDaan = isModuleVisible(auth, MODULE_KEYS.DAAN);
  const showBichayat = isModuleVisible(auth, MODULE_KEYS.BICHAYAT);
  const showBhaktNiwas = isModuleVisible(auth, MODULE_KEYS.BHAKT_NIWAS);
  const showReports = isModuleVisible(auth, MODULE_KEYS.REPORTS);
  const showMaster = isModuleVisible(auth, MODULE_KEYS.MASTER);

  const openInventory = Boolean(inventoryAnchor);
  const openRental    = Boolean(rentalAnchor);
  const openProfile   = Boolean(profileAnchor);
  const openReport    = Boolean(reportAnchor);
  const openRoom      = Boolean(roomAnchor);

  const closeMobile = () => setMobileOpen(false);
  const goMobile = (path) => { closeMobile(); navigate(path); };
  const toggleGroup = (key) => setMobileExpanded((cur) => (cur === key ? "" : key));

  const navButtonSx = { fontSize: "0.8rem", whiteSpace: "nowrap", px: 1.4 };
  const activeNavSx = {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderBottom: "2px solid #fff",
    borderRadius: "4px 4px 0 0",
  };
  const navSx = (key) => ({ ...navButtonSx, ...(matchesNav(location.pathname, key) ? activeNavSx : {}) });

  return (
    <AppBar position="static" sx={{ backgroundColor: "#7a1f1f" }}>
      {/* Row 1: logo (left) + hamburger/language/profile (right) */}
      <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minHeight: { xs: 52, md: 56 } }}>

        {/* Left: hamburger (mobile) + logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: "1 1 auto" }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ flexShrink: 0 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              cursor: "pointer", fontWeight: 600,
              fontSize: { xs: "0.78rem", sm: "0.9rem", md: "1rem" },
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              minWidth: 0,
            }}
            onClick={() => navigate("/")}
          >
            🛕 {language === "hi" ? "चमत्कारिक श्री हनुमान मंदिर जामसावली" : "Chamatkarik Shree Hanuman Mandir Jamsawli"}
          </Typography>
        </Box>

        {/* Right side: Language Toggle + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}>

          {/* ── Language Toggle in Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {!isMobile && <TranslateIcon sx={{ fontSize: "1rem", opacity: 0.8 }} />}
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={(_, lang) => lang && setLanguage(lang)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  color: "white",
                  borderColor: "rgba(255,255,255,0.4)",
                  fontSize: "0.72rem",
                  padding: { xs: "2px 6px", md: "2px 8px" },
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
          <IconButton color="inherit" onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ px: { xs: 0.5, md: 1 } }}>
            <AccountCircle />
            {!isMobile && (
              <Typography sx={{ ml: 1, fontSize: "0.85rem" }}>
                {auth.username}
              </Typography>
            )}
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
            {isAdmin && (
              <MenuItem onClick={() => { setProfileAnchor(null); navigate("/settings/module-access"); }}>
                {t("moduleAccess")}
              </MenuItem>
            )}
            <MenuItem
              onClick={() => { setProfileAnchor(null); logout(); }}
              sx={{ color: "#7a1f1f", fontWeight: 500 }}
            >
              {t("logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Row 2: nav menu — desktop only, its own aligned row */}
      {!isMobile && (
        <Toolbar
          variant="dense"
          sx={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 0.8, minHeight: 42,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>

            <Button color="inherit" onClick={() => navigate("/")} sx={navSx("home")}>
              {t("home")}
            </Button>

            {showDaan && (
              <Button color="inherit" onClick={() => navigate("/donation")} sx={navSx("donation")}>
                {t("donation")}
              </Button>
            )}

            {/* Rental Dropdown */}
            {showBichayat && (
              <>
                <Button color="inherit" endIcon={<ArrowDropDownIcon />}
                  onClick={(e) => setRentalAnchor(e.currentTarget)} sx={navSx("rental")}>
                  {t("rental")}
                </Button>
                <Menu anchorEl={rentalAnchor} open={openRental} onClose={() => setRentalAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}>
                  <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/bartan"); }}>{t("bartan")}</MenuItem>
                  <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/bichayat"); }}>{t("bichayat")}</MenuItem>
                  <MenuItem onClick={() => { setRentalAnchor(null); navigate("/rentals/return"); }}>{t("returnRental")}</MenuItem>
                </Menu>
              </>
            )}

            {/* Bhakt Niwas Dropdown */}
            {showBhaktNiwas && (
              <>
                <Button color="inherit" endIcon={<ArrowDropDownIcon />}
                  onClick={(e) => setRoomAnchor(e.currentTarget)} sx={navSx("bhaktNiwas")}>
                  {t("bhaktNiwas")}
                </Button>
                <Menu anchorEl={roomAnchor} open={openRoom} onClose={() => setRoomAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}>
                  <MenuItem onClick={() => { setRoomAnchor(null); navigate("/bhakt-niwas"); }}>{t("bhaktNiwasDash")}</MenuItem>
                  <MenuItem onClick={() => { setRoomAnchor(null); navigate("/bhakt-niwas-search"); }}>{t("bookingSearch")}</MenuItem>
                  <MenuItem onClick={() => { setRoomAnchor(null); navigate("/inventory/rooms"); }}>{t("roomInventory")}</MenuItem>
                  <MenuItem onClick={() => { setRoomAnchor(null); navigate("/inventory/room-categories"); }}>{t("roomCategories")}</MenuItem>
                </Menu>
              </>
            )}

            {/* Reports Dropdown */}
            {showReports && (
              <>
                <Button color="inherit" endIcon={<ArrowDropDownIcon />}
                  onClick={(e) => setReportAnchor(e.currentTarget)} sx={navSx("reports")}>
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
              </>
            )}

            {/* Master Dropdown */}
            {showMaster && (
              <>
                <Button color="inherit" endIcon={<ArrowDropDownIcon />}
                  onClick={(e) => setInventoryAnchor(e.currentTarget)} sx={navSx("master")}>
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
              </>
            )}

            {isAdmin && (
              <Button color="inherit" onClick={() => navigate("/users")} sx={navSx("users")}>
                {t("users")}
              </Button>
            )}
          </Box>
        </Toolbar>
      )}

      {/* Mobile nav drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={closeMobile}>
        <Box sx={{ width: 280 }} role="presentation">
          <List>
            <ListItemButton selected={matchesNav(location.pathname, "home")} onClick={() => goMobile("/")}>
              <ListItemText primary={t("home")} />
            </ListItemButton>
            {showDaan && (
              <ListItemButton selected={matchesNav(location.pathname, "donation")} onClick={() => goMobile("/donation")}>
                <ListItemText primary={t("donation")} />
              </ListItemButton>
            )}

            <Divider />

            {showBichayat && (
              <>
                <ListItemButton selected={matchesNav(location.pathname, "rental")} onClick={() => toggleGroup("rental")}>
                  <ListItemText primary={t("rental")} />
                  {mobileExpanded === "rental" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={mobileExpanded === "rental"} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/rentals/bartan")}><ListItemText primary={t("bartan")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/rentals/bichayat")}><ListItemText primary={t("bichayat")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/rentals/return")}><ListItemText primary={t("returnRental")} /></ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {showBhaktNiwas && (
              <>
                <ListItemButton selected={matchesNav(location.pathname, "bhaktNiwas")} onClick={() => toggleGroup("bhaktNiwas")}>
                  <ListItemText primary={t("bhaktNiwas")} />
                  {mobileExpanded === "bhaktNiwas" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={mobileExpanded === "bhaktNiwas"} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/bhakt-niwas")}><ListItemText primary={t("bhaktNiwasDash")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/bhakt-niwas-search")}><ListItemText primary={t("bookingSearch")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/inventory/rooms")}><ListItemText primary={t("roomInventory")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/inventory/room-categories")}><ListItemText primary={t("roomCategories")} /></ListItemButton>
                  </List>
                </Collapse>
              </>
            )}

            {showReports && (
              <>
                <ListItemButton selected={matchesNav(location.pathname, "reports")} onClick={() => toggleGroup("reports")}>
                  <ListItemText primary={t("reports")} />
                  {mobileExpanded === "reports" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={mobileExpanded === "reports"} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/reports/rentals/my-entries")}><ListItemText primary={t("myEntries")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/reports/rentals/my")}><ListItemText primary={t("myRentalSummary")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/reports/rentals/pending")}><ListItemText primary={t("pendingRentals")} /></ListItemButton>
                    {isAdmin && (
                      <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/reports/rentals/admin")}><ListItemText primary={t("adminRental")} /></ListItemButton>
                    )}
                  </List>
                </Collapse>
              </>
            )}

            {showMaster && (
              <>
                <ListItemButton selected={matchesNav(location.pathname, "master")} onClick={() => toggleGroup("master")}>
                  <ListItemText primary={t("master")} />
                  {mobileExpanded === "master" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={mobileExpanded === "master"} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/inventory/bartan")}><ListItemText primary={t("bartan")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/inventory/bichayat")}><ListItemText primary={t("bichayat")} /></ListItemButton>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/gotra")}><ListItemText primary={t("gotra")} /></ListItemButton>
                    {isAdmin && (
                      <ListItemButton sx={{ pl: 4 }} onClick={() => goMobile("/master/donation-purpose")}><ListItemText primary={t("donationPurpose")} /></ListItemButton>
                    )}
                  </List>
                </Collapse>
              </>
            )}

            {isAdmin && (
              <ListItemButton selected={matchesNav(location.pathname, "users")} onClick={() => goMobile("/users")}>
                <ListItemText primary={t("users")} />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
