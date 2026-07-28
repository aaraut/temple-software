import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Paper,
  CircularProgress,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";

import { getBhaktniwasBlocks, getDailySheet, updateCleaningStatus } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";
import SlotSidebar from "../../components/bhaktniwas/SlotSidebar";
import { todayStr, addDays, formatDateTime } from "../../utils/dateUtils";

const CLEANING_CYCLE = ["CLEAN", "DIRTY", "CLEANING_IN_PROGRESS"];
const CLEANING_COLOR = { CLEAN: "#2e7d32", DIRTY: "#c62828", CLEANING_IN_PROGRESS: "#f9a825" };

function isNonAttached(categoryName) {
  return /non.?attached|^na$/i.test(categoryName || "");
}

function SlotBox({ slot, disabled, onClick, language }) {
  const isAvailable = slot.status === "AVAILABLE";
  const isCheckedIn = slot.status === "CHECKED_IN" && !slot.pending;
  const isPending = slot.pending;
  const isDone = !isAvailable && !isCheckedIn && !isPending; // CHECKED_OUT / ROOM_SHIFTED / CANCELLED

  const bg = disabled
    ? "#9e9e9e"
    : isAvailable
    ? "#2e7d32"
    : isPending
    ? "#c62828"
    : isCheckedIn
    ? "#ed6c02"
    : "#9e9e9e";

  return (
    <Box
      onClick={() => !disabled && onClick()}
      sx={{
        borderRadius: 1,
        p: 0.75,
        mb: 0.5,
        color: "#fff",
        backgroundColor: bg,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        border: isPending ? "2px solid #7f0000" : "none",
      }}
    >
      <Typography variant="caption" sx={{
        display: "block", fontWeight: 700, lineHeight: 1.3,
        textDecoration: isDone ? "line-through" : "none",
      }}>
        {isAvailable
          ? (language === "hi" ? "उपलब्ध" : "Available")
          : (slot.guestName || slot.status)}
      </Typography>
      {!isAvailable && slot.checkInTime && (
        <Typography variant="caption" sx={{
          display: "block", lineHeight: 1.3,
          textDecoration: isDone ? "line-through" : "none",
        }}>
          {formatDateTime(slot.checkInTime)}
        </Typography>
      )}
      {isPending && (
        <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
          {language === "hi" ? "चेकआउट लंबित" : "CHECKOUT OVERDUE"}
        </Typography>
      )}
    </Box>
  );
}

export default function RoomGridPage() {
  const { blockId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { auth, language } = useAuth();

  const L = {
    en: { back: "← Back", date: "Date", blocked: "BLOCKED", maintenance: "Maintenance",
      noRooms: "No rooms in this block yet.",
      readOnly: "Viewing a past date — read-only, no booking actions allowed.",
      search: "Search Bookings" },
    hi: { back: "← वापस", date: "दिनांक", blocked: "अवरुद्ध", maintenance: "रखरखाव",
      noRooms: "इस ब्लॉक में अभी तक कोई कमरा नहीं है।",
      readOnly: "पिछली तारीख देखी जा रही है — केवल पढ़ने योग्य, कोई बुकिंग कार्रवाई नहीं।",
      search: "बुकिंग खोजें" },
  };
  const t = L[language] ?? L.en;

  const date = searchParams.get("date") || todayStr();
  const isToday = date === todayStr();
  const [blockName, setBlockName] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState({ open: false, room: null, slot: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [blocks, sheet] = await Promise.all([
        getBhaktniwasBlocks(),
        getDailySheet(blockId, date),
      ]);
      const block = blocks.find((b) => String(b.id) === String(blockId));
      setBlockName(block ? block.displayName : "");
      setRooms(sheet);
    } finally {
      setLoading(false);
    }
  }, [blockId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDateChange = (newDate) => {
    // Future dates are disabled — clamp to today regardless of what the native picker allowed
    setSearchParams({ date: newDate > todayStr() ? todayStr() : newDate });
  };

  const cycleCleaning = async (roomId, current) => {
    if (!isToday) return;
    const idx = CLEANING_CYCLE.indexOf(current || "CLEAN");
    const next = CLEANING_CYCLE[(idx + 1) % CLEANING_CYCLE.length];
    await updateCleaningStatus(roomId, { cleaningStatus: next, handledBy: auth.username });
    load();
  };

  const openSlot = (room, slot) => {
    const hasActiveOccupant = room.slots.some((s) => s.status === "CHECKED_IN");
    const canBookHere = isToday && !room.blocked && !room.maintenance && !hasActiveOccupant;
    // An "Available" slot has no data to view — only worth opening when it's actually bookable.
    if (slot.status === "AVAILABLE" && !canBookHere) return;
    // Checkout is a "right now" action — blocked/maintenance flags don't stop checking a guest
    // out, only viewing a non-today date does.
    setSidebar({ open: true, room, slot, readOnly: !isToday });
  };

  return (
    <Box sx={{ maxWidth: 1400, margin: "auto", p: 2 }}>
      <Button onClick={() => navigate("/bhakt-niwas")}>{t.back}</Button>

      <Typography variant="h5" sx={{ mt: 1, mb: 2 }}>
        {blockName}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
        <IconButton onClick={() => handleDateChange(addDays(date, -1))} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <TextField
          type="date"
          label={t.date}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          sx={{ minWidth: 220 }}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: todayStr() }}
        />
        <IconButton
          onClick={() => handleDateChange(addDays(date, 1))}
          disabled={isToday}
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

      {!isToday && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {t.readOnly}
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : rooms.length === 0 ? (
        <Typography color="text.secondary">{t.noRooms}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {rooms.map((room) => {
            const roomLocked = room.blocked || room.maintenance || !isToday;
            const hasActiveOccupant = room.slots.some((s) => s.status === "CHECKED_IN");

            return (
              <Paper key={room.roomId} sx={{ width: 190, p: 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {room.roomNumber}{isNonAttached(room.categoryName) ? " (NA)" : ""}
                  </Typography>
                  <Tooltip title={room.cleaningStatus || "CLEAN"}>
                    <Box
                      onClick={() => cycleCleaning(room.roomId, room.cleaningStatus)}
                      sx={{
                        width: 14, height: 14, borderRadius: "50%", cursor: "pointer",
                        backgroundColor: CLEANING_COLOR[room.cleaningStatus] || CLEANING_COLOR.CLEAN,
                      }}
                    />
                  </Tooltip>
                </Box>

                {room.maintenance && (
                  <Typography variant="caption" sx={{ display: "block", color: "warning.main", fontWeight: 700, mb: 0.5 }}>
                    {t.maintenance}
                  </Typography>
                )}
                {room.blocked && (
                  <Tooltip title={`${room.blockedBy || "-"} — ${room.blockReason || "-"}`}>
                    <Typography variant="caption" sx={{ display: "block", color: "error.main", fontWeight: 700, mb: 0.5 }}>
                      {t.blocked}
                    </Typography>
                  </Tooltip>
                )}

                {room.slots.map((slot) => {
                  // Only the "Available" placeholder can be truly non-interactive (no data to
                  // view). Slots with real booking data always stay clickable — the sidebar
                  // just opens read-only when the room/date isn't actionable.
                  const slotDisabled =
                    slot.status === "AVAILABLE" && (roomLocked || hasActiveOccupant);
                  return (
                    <SlotBox
                      key={`${slot.pending ? "pending" : slot.slotNumber}`}
                      slot={slot}
                      disabled={slotDisabled}
                      onClick={() => openSlot(room, slot)}
                      language={language}
                    />
                  );
                })}
              </Paper>
            );
          })}
        </Box>
      )}

      <SlotSidebar
        open={sidebar.open}
        room={sidebar.room}
        slot={sidebar.slot}
        readOnly={sidebar.readOnly}
        onClose={() => setSidebar({ open: false, room: null, slot: null })}
        onSuccess={load}
      />
    </Box>
  );
}
