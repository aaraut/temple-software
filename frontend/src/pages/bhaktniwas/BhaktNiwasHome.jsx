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
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";

import { getBhaktniwasBlocks, getRooms } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";
import { todayStr, addDays } from "../../utils/dateUtils";

export default function BhaktNiwasHome() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const L = {
    en: {
      title: "Bhaktniwas",
      date: "Date",
      rooms: "Rooms",
      loading: "Loading...",
      noBlocks: "No active blocks configured yet.",
      search: "Search Bookings",
    },
    hi: {
      title: "भक्त निवास",
      date: "दिनांक",
      rooms: "कमरे",
      loading: "लोड हो रहा है...",
      noBlocks: "अभी तक कोई सक्रिय ब्लॉक कॉन्फ़िगर नहीं किया गया।",
      search: "बुकिंग खोजें",
    },
  };
  const t = L[language] ?? L.en;

  const [date, setDate] = useState(todayStr());
  const [blocks, setBlocks] = useState([]);
  const [roomCounts, setRoomCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [blockData, roomData] = await Promise.all([
          getBhaktniwasBlocks(),
          getRooms(),
        ]);
        setBlocks(blockData);

        const counts = {};
        roomData.forEach((r) => {
          counts[r.bhaktniwasBlockId] = (counts[r.bhaktniwasBlockId] || 0) + 1;
        });
        setRoomCounts(counts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Box sx={{ maxWidth: 1000, margin: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t.title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 3 }}>
        <IconButton onClick={() => setDate(addDays(date, -1))} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <TextField
          type="date"
          label={t.date}
          value={date}
          onChange={(e) => setDate(e.target.value > todayStr() ? todayStr() : e.target.value)}
          sx={{ minWidth: 220 }}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: todayStr() }}
        />
        <IconButton
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= todayStr()}
          size="small"
        >
          <ChevronRightIcon />
        </IconButton>

        <Tooltip title={t.search}>
          <IconButton onClick={() => navigate("/bhakt-niwas-search")} size="small" sx={{ ml: 1 }}>
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : blocks.length === 0 ? (
        <Typography color="text.secondary">{t.noBlocks}</Typography>
      ) : (
        <Grid container spacing={2}>
          {blocks.map((b) => (
            <Grid item xs={12} sm={6} md={4} key={b.id}>
              <Paper
                elevation={2}
                onClick={() =>
                  navigate(`/bhakt-niwas/${b.id}?date=${date}`)
                }
                sx={{
                  p: 3,
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                }}
              >
                <Typography variant="h6">{b.displayName}</Typography>
                <Typography color="text.secondary">
                  {roomCounts[b.id] || 0} {t.rooms}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
