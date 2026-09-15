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
  Chip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";

import { getBhaktniwasBlocks, getDailySheet, updateCleaningStatus } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";
import SlotSidebar from "../../components/bhaktniwas/SlotSidebar";
import { localizeBlockName } from "../../utils/bhaktniwasUtils";
import { todayStr, addDays, formatDateTime } from "../../utils/dateUtils";

const CLEANING_CYCLE = ["CLEAN", "DIRTY", "CLEANING_IN_PROGRESS"];
const CLEANING_COLOR = { CLEAN: "#2e7d32", DIRTY: "#c62828", CLEANING_IN_PROGRESS: "#f9a825" };

const STATUS_COLORS = {
  available: { fg: "#1b5e20", bg: "#e6f4ea" },
  occupied: { fg: "#b3261e", bg: "#fbe9e7" },
  cleaning: { fg: "#95700a", bg: "#fff6df" },
  blocked: { fg: "#5f6368", bg: "#eceff1" },
};

function isNonAttached(categoryName) {
  return /non.?attached|^na$/i.test(categoryName || "");
}

function roomStatusKey(room) {
  const hasActiveOccupant = (room.slots || []).some((s) => s.status === "CHECKED_IN");
  if (room.blocked || room.maintenance) return "blocked";
  if (hasActiveOccupant) return "occupied";
  if (room.cleaningStatus === "DIRTY" || room.cleaningStatus === "CLEANING_IN_PROGRESS") return "cleaning";
  return "available";
}

function computeCounts(rooms) {
  const counts = { available: 0, occupied: 0, cleaning: 0, blocked: 0 };
  (rooms || []).forEach((r) => {
    counts[roomStatusKey(r)] += 1;
  });
  return counts;
}

function StatCard({ label, value, statusKey }) {
  const c = STATUS_COLORS[statusKey];
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 130,
        p: 2,
        borderRadius: 2,
        backgroundColor: c.bg,
        border: `1px solid ${c.bg}`,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, color: c.fg, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: c.fg, fontWeight: 600 }}>
        {label}
      </Typography>
    </Paper>
  );
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
      search: "Search Bookings",
      available: "Available", occupied: "Occupied", cleaning: "Cleaning", blockedNa: "Blocked / NA",
      perNight: "/ night", legendClean: "Clean / Available", legendCleaning: "Cleaning in progress",
      legendDirty: "Dirty", legendBlockedNa: "Blocked / Not available (NA)" },
    hi: { back: "← वापस", date: "दिनांक", blocked: "अवरुद्ध", maintenance: "रखरखाव",
      noRooms: "इस ब्लॉक में अभी तक कोई कमरा नहीं है।",
      readOnly: "पिछली तारीख देखी जा रही है — केवल पढ़ने योग्य, कोई बुकिंग कार्रवाई नहीं।",
      search: "बुकिंग खोजें",
      available: "उपलब्ध", occupied: "व्यस्त", cleaning: "सफाई जारी", blockedNa: "ब्लॉक / NA",
      perNight: "/ रात", legendClean: "साफ / उपलब्ध", legendCleaning: "सफाई जारी",
      legendDirty: "गंदा", legendBlockedNa: "ब्लॉक / उपलब्ध नहीं (NA)" },
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
      setBlockName(block ? localizeBlockName(block.displayName, language) : "");
      setRooms(sheet);
    } finally {
      setLoading(false);
    }
  }, [blockId, date, language]);

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

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mt: 1, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {blockName}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
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
            <IconButton onClick={() => handleDateChange(addDays(date, -1))} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <TextField
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              variant="standard"
              sx={{ minWidth: 170 }}
              InputProps={{ disableUnderline: true }}
              inputProps={{ max: todayStr() }}
            />
            <IconButton
              onClick={() => handleDateChange(addDays(date, 1))}
              disabled={isToday}
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
        <>
          {(() => {
            const counts = computeCounts(rooms);
            return (
              <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <StatCard label={t.available} value={counts.available} statusKey="available" />
                <StatCard label={t.occupied} value={counts.occupied} statusKey="occupied" />
                <StatCard label={t.cleaning} value={counts.cleaning} statusKey="cleaning" />
                <StatCard label={t.blockedNa} value={counts.blocked} statusKey="blocked" />
              </Box>
            );
          })()}

          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2, flexWrap: "wrap" }}>
            {[
              [CLEANING_COLOR.CLEAN, t.legendClean],
              [CLEANING_COLOR.CLEANING_IN_PROGRESS, t.legendCleaning],
              [CLEANING_COLOR.DIRTY, t.legendDirty],
              ["#9e9e9e", t.legendBlockedNa],
            ].map(([color, label]) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {rooms.map((room) => {
              const roomLocked = room.blocked || room.maintenance || !isToday;
              const hasActiveOccupant = room.slots.some((s) => s.status === "CHECKED_IN");
              const statusKey = roomStatusKey(room);
              const c = STATUS_COLORS[statusKey];
              const statusLabel = { available: t.available, occupied: t.occupied, cleaning: t.cleaning, blocked: t.blockedNa }[statusKey];

              return (
                <Paper
                  key={room.roomId}
                  sx={{
                    width: 200,
                    p: 1.25,
                    borderLeft: `4px solid ${c.fg}`,
                    borderRadius: 1.5,
                  }}
                >
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

                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.25 }}>
                    {room.categoryName}
                  </Typography>
                  {room.baseRent24Hr != null && (
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.75 }}>
                      ₹{room.baseRent24Hr} {t.perNight}
                    </Typography>
                  )}

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

                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{ backgroundColor: c.bg, color: c.fg, fontWeight: 700, mb: 0.75 }}
                  />

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
        </>
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
