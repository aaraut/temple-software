import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { getBhaktniwasBlocks, getDailySheet } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";
import { todayStr, addDays } from "../../utils/dateUtils";
import { localizeBlockName } from "../../utils/bhaktniwasUtils";

import bhaktniwas1 from "../../assets/bhaktniwas-1.jpg";
import bhaktniwas2 from "../../assets/bhaktniwas-2.jpg";
import bhaktniwas3 from "../../assets/bhaktniwas-3.jpg";

const BLOCK_IMAGES = [bhaktniwas1, bhaktniwas2, bhaktniwas3];

const STATUS_COLORS = {
  available: { fg: "#1b5e20", bg: "#e6f4ea" },
  occupied: { fg: "#b3261e", bg: "#fbe9e7" },
  cleaning: { fg: "#95700a", bg: "#fff6df" },
  blocked: { fg: "#5f6368", bg: "#eceff1" },
};

function computeCounts(rooms) {
  const counts = { available: 0, occupied: 0, cleaning: 0, blocked: 0 };
  (rooms || []).forEach((r) => {
    const hasActiveOccupant = (r.slots || []).some((s) => s.status === "CHECKED_IN");
    if (r.blocked || r.maintenance) counts.blocked += 1;
    else if (hasActiveOccupant) counts.occupied += 1;
    else if (r.cleaningStatus === "DIRTY" || r.cleaningStatus === "CLEANING_IN_PROGRESS") counts.cleaning += 1;
    else counts.available += 1;
  });
  return counts;
}

function StatRow({ label, value, statusKey }) {
  const c = STATUS_COLORS[statusKey];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.4 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c.fg, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ flex: 1 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function StatCard({ label, value, statusKey, size = "large" }) {
  const c = STATUS_COLORS[statusKey];
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: size === "large" ? 130 : 90,
        p: size === "large" ? 2 : 1,
        borderRadius: 2,
        backgroundColor: c.bg,
        border: `1px solid ${c.bg}`,
      }}
    >
      <Typography
        variant={size === "large" ? "h5" : "subtitle1"}
        sx={{ fontWeight: 800, color: c.fg, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: c.fg, fontWeight: 600 }}>
        {label}
      </Typography>
    </Paper>
  );
}

export default function BhaktNiwasHome() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const L = {
    en: {
      title: "Bhaktniwas",
      subtitle: "Guest accommodation for temple visitors",
      date: "Date",
      dateLabel: "Date (for all Bhaktniwas)",
      rooms: "Rooms",
      loading: "Loading...",
      noBlocks: "No active blocks configured yet.",
      search: "Search Bookings",
      available: "Available",
      occupied: "Occupied",
      cleaning: "Cleaning",
      blocked: "Blocked / NA",
      viewRooms: "View Rooms",
      hint: "Click any building to see available rooms and make a booking for the selected date.",
    },
    hi: {
      title: "भक्त निवास",
      subtitle: "मंदिर आने वाले श्रद्धालुओं के लिए आवास सुविधा",
      date: "दिनांक",
      dateLabel: "तिथि (सभी भक्त निवास के लिए)",
      rooms: "कमरे",
      loading: "लोड हो रहा है...",
      noBlocks: "अभी तक कोई सक्रिय ब्लॉक कॉन्फ़िगर नहीं किया गया।",
      search: "बुकिंग खोजें",
      available: "उपलब्ध",
      occupied: "व्यस्त",
      cleaning: "सफाई जारी",
      blocked: "ब्लॉक / NA",
      viewRooms: "कमरे देखें",
      hint: "चयनित तारीख के अनुसार उपलब्ध कमरों की जानकारी देखने और बुकिंग करने के लिए किसी भी भक्त निवास पर क्लिक करें।",
    },
  };
  const t = L[language] ?? L.en;

  const [date, setDate] = useState(todayStr());
  const [blocks, setBlocks] = useState([]);
  const [blockRooms, setBlockRooms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const blockData = await getBhaktniwasBlocks();
        if (cancelled) return;
        setBlocks(blockData);

        const sheets = await Promise.all(
          blockData.map((b) =>
            getDailySheet(b.id, date).catch(() => [])
          )
        );
        if (cancelled) return;
        const map = {};
        blockData.forEach((b, i) => {
          map[b.id] = sheets[i];
        });
        setBlockRooms(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const allRooms = Object.values(blockRooms).flat();
  const totals = computeCounts(allRooms);

  return (
    <Box sx={{ maxWidth: 1500, margin: "auto", p: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {t.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.subtitle}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          {t.dateLabel}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              pl: 0.5,
            }}
          >
            <IconButton onClick={() => setDate(addDays(date, -1))} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <TextField
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value > todayStr() ? todayStr() : e.target.value)}
              variant="standard"
              sx={{ minWidth: 190 }}
              InputProps={{ disableUnderline: true }}
              inputProps={{ max: todayStr() }}
            />
            <IconButton
              onClick={() => setDate(addDays(date, 1))}
              disabled={date >= todayStr()}
              size="small"
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <Tooltip title={t.search}>
            <IconButton
              onClick={() => navigate("/bhakt-niwas-search")}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
            <StatCard label={t.available} value={totals.available} statusKey="available" />
            <StatCard label={t.occupied} value={totals.occupied} statusKey="occupied" />
            <StatCard label={t.cleaning} value={totals.cleaning} statusKey="cleaning" />
            <StatCard label={t.blocked} value={totals.blocked} statusKey="blocked" />
          </Box>

          {blocks.length === 0 ? (
            <Typography color="text.secondary">{t.noBlocks}</Typography>
          ) : (
            <Grid container spacing={2.5}>
              {blocks.map((b, index) => {
                const roomsForBlock = blockRooms[b.id] || [];
                const c = computeCounts(roomsForBlock);
                const image = BLOCK_IMAGES[index];
                return (
                  <Grid item xs={12} sm={4} key={b.id} sx={{ minWidth: 300 }}>
                    <Paper
                      elevation={2}
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                      }}
                    >
                      {image ? (
                        <Box
                          sx={{
                            height: 200,
                            backgroundColor: "#f3e9dc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            component="img"
                            src={image}
                            alt={b.displayName}
                            sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            height: 200,
                            backgroundColor: "#f3e9dc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ApartmentIcon sx={{ fontSize: 56, color: "#c8894a" }} />
                        </Box>
                      )}

                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {localizeBlockName(b.displayName, language)}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                          {roomsForBlock.length} {t.rooms}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <StatRow label={t.available} value={c.available} statusKey="available" />
                          <StatRow label={t.occupied} value={c.occupied} statusKey="occupied" />
                          <StatRow label={t.cleaning} value={c.cleaning} statusKey="cleaning" />
                          <StatRow label={t.blocked} value={c.blocked} statusKey="blocked" />
                        </Box>

                        <Button
                          fullWidth
                          variant="contained"
                          color="error"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate(`/bhakt-niwas/${b.id}?date=${date}`)}
                        >
                          {t.viewRooms}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          <Paper
            elevation={0}
            sx={{ mt: 4, p: 2, borderRadius: 2, backgroundColor: "#fdf6ec", display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t.hint}
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}
