import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, ToggleButtonGroup, ToggleButton, Autocomplete,
  Alert, IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { getRooms, blockRooms, unblockRooms } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";

const nowLocal = () => {
  const d = new Date(); d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nextDay = (dtStr) => {
  if (!dtStr) return "";
  const d = new Date(dtStr);
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function BlockRoomsDialog({ open, onClose, blocks, onSuccess }) {
  const { auth, language } = useAuth();

  const L = {
    en: {
      title: "Block / Unblock Rooms", block: "Block", unblock: "Unblock",
      rooms: "Rooms (leave empty for all)", reason: "Reason", from: "From", to: "To",
      submitBlock: "Block Rooms", submitUnblock: "Unblock Rooms", close: "Close",
      blockedMsg: (n, s) => `${n} room(s) blocked${s > 0 ? `, ${s} had conflicts` : ""}`,
      unblockedMsg: "Rooms unblocked successfully", selectDates: "Please select both dates",
      invalidRange: "'To' must be after 'From'",
    },
    hi: {
      title: "कमरे ब्लॉक / अनब्लॉक करें", block: "ब्लॉक", unblock: "अनब्लॉक",
      rooms: "कमरे (सभी के लिए खाली छोड़ें)", reason: "कारण", from: "से", to: "तक",
      submitBlock: "कमरे ब्लॉक करें", submitUnblock: "कमरे अनब्लॉक करें", close: "बंद करें",
      blockedMsg: (n, s) => `${n} कमरे ब्लॉक हुए${s > 0 ? `, ${s} में टकराव मिला` : ""}`,
      unblockedMsg: "कमरे अनब्लॉक हो गए", selectDates: "कृपया दोनों तारीखें चुनें",
      invalidRange: "'तक' की तारीख 'से' के बाद होनी चाहिए",
    },
  };
  const t = L[language] ?? L.en;

  const [mode, setMode] = useState("block");
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState(nowLocal());
  const [to, setTo] = useState(nextDay(nowLocal()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMode("block");
    setSelectedRooms([]);
    setReason("");
    setFrom(nowLocal());
    setTo(nextDay(nowLocal()));
    setError("");
    setResult(null);
    getRooms().then(setAllRooms).catch(() => setAllRooms([]));
  }, [open]);

  const blockNameById = (id) => blocks.find((b) => b.id === id)?.displayName || "";

  const handleSubmit = async () => {
    if (!from || !to) { setError(t.selectDates); return; }
    if (new Date(to) <= new Date(from)) { setError(t.invalidRange); return; }
    setError(""); setLoading(true);
    const roomIds = selectedRooms.length > 0 ? selectedRooms.map((r) => r.id) : null;
    try {
      if (mode === "block") {
        const res = await blockRooms({
          roomIds, blockFrom: from, blockTo: to,
          reason: reason || "Festival/Event", blockedBy: auth.username,
        });
        setResult({ type: "block", blockedCount: res.data.blockedCount, skippedCount: res.data.skippedCount });
      } else {
        await unblockRooms({ roomIds, unblockFrom: from, unblockTo: to, unblockedBy: auth.username });
        setResult({ type: "unblock" });
      }
      onSuccess?.();
    } catch (e) {
      setError(e.response?.data?.message || (mode === "block" ? "Block failed" : "Unblock failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {t.title}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ mb: 2, mt: 0.5 }}
        >
          <ToggleButton value="block">{t.block}</ToggleButton>
          <ToggleButton value="unblock">{t.unblock}</ToggleButton>
        </ToggleButtonGroup>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {result && result.type === "block" && (
          <Alert severity="success" sx={{ mb: 2 }}>{t.blockedMsg(result.blockedCount, result.skippedCount)}</Alert>
        )}
        {result && result.type === "unblock" && (
          <Alert severity="success" sx={{ mb: 2 }}>{t.unblockedMsg}</Alert>
        )}

        <Autocomplete
          multiple
          options={allRooms}
          value={selectedRooms}
          onChange={(_, v) => setSelectedRooms(v)}
          getOptionLabel={(r) => `${r.roomNumber} — ${blockNameById(r.bhaktniwasBlockId)}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label={t.rooms} sx={{ mb: 2 }} />}
        />

        {mode === "block" && (
          <TextField fullWidth sx={{ mb: 2 }} label={t.reason} value={reason} onChange={(e) => setReason(e.target.value)} />
        )}

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField fullWidth type="datetime-local" label={t.from} value={from}
            onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth type="datetime-local" label={t.to} value={to}
            onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t.close}</Button>
        <Button
          variant="contained"
          color={mode === "block" ? "error" : "success"}
          disabled={loading}
          onClick={handleSubmit}
        >
          {mode === "block" ? t.submitBlock : t.submitUnblock}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
