import { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getRevenueReport, searchBookings,
} from "../../api/roomBookingApi";
import { getRooms, getBlocksForMonth } from "../../api/roomApi";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:        "#fdf9f4",
  card:      "#ffffff",
  accent:    "#c8894a",
  accentDk:  "#9a6030",
  saffron:   "#e8a020",
  border:    "#e8ddd0",
  text:      "#2d1f0f",
  muted:     "#8a7560",
  green:     "#2d7a2d",
  greenBg:   "#e8f5e8",
  yellow:    "#9a7020",
  yellowBg:  "#fffbe6",
  red:       "#b03030",
  redBg:     "#fdf0f0",
  blue:      "#1a4a8a",
  blueBg:    "#e8f0fc",
};

// ─── Labels ─────────────────────────────────────────────────────────────────
const L = {
  hi: {
    title: "भक्त निवास",
    subtitle: "कक्ष प्रबंधन डैशबोर्ड",
    totalRooms: "कुल कमरे",
    occupied: "भरे हुए",
    available: "उपलब्ध",
    occupancy: "अधिभोग",
    todayCheckins: "आज चेक-इन",
    todayCheckouts: "आज चेक-आउट",
    newBooking: "नई बुकिंग",
    checkIn: "चेक-इन",
    checkOut: "चेकआउट",
    findRoom: "उपलब्धता देखें",
    blockRoom: "कमरा ब्लॉक करें",
    manageRooms: "कमरा सूची",
    revenue: "राजस्व",
    daily: "आज",
    weekly: "सप्ताह",
    monthly: "माह",
    calendar: "बुकिंग कैलेंडर",
    booked: "बुक",
    blocked: "ब्लॉक्ड",
    loading: "लोड हो रहा है...",
    noData: "कोई डेटा नहीं",
    rooms: "कमरे",
    mon: "सो", tue: "मं", wed: "बु", thu: "गु", fri: "शु", sat: "श", sun: "र",
  },
  en: {
    title: "Bhakt Niwas",
    subtitle: "Room Management Dashboard",
    totalRooms: "Total Rooms",
    occupied: "Occupied",
    available: "Available",
    occupancy: "Occupancy",
    todayCheckins: "Today Check-ins",
    todayCheckouts: "Today Check-outs",
    newBooking: "New Booking",
    checkIn: "Check-In",
    checkOut: "Check-Out",
    findRoom: "Find Availability",
    blockRoom: "Block Rooms",
    manageRooms: "Manage Rooms",
    revenue: "Revenue",
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    calendar: "Booking Calendar",
    booked: "Booked",
    blocked: "Blocked",
    loading: "Loading...",
    noData: "No data",
    rooms: "rooms",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const toLocalDt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0);
const endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
const startOfWeek = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return startOfDay(d); };
const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// ─── Sub-components ──────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, color = C.accent, icon, bg }) => (
  <Box sx={{
    background: bg || C.card, borderRadius: "12px", p: "1.1rem 1.3rem",
    border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "0.3rem",
    boxShadow: "0 2px 8px rgba(139,100,60,0.07)", position: "relative", overflow: "hidden",
    "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: color, borderRadius: "12px 12px 0 0" },
  }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: color, lineHeight: 1 }}>{value ?? "—"}</Typography>
    {sub && <Typography sx={{ fontSize: "0.72rem", color: C.muted }}>{sub}</Typography>}
  </Box>
);

const ActionBtn = ({ icon, label, onClick, color = C.accent, bg = "#fff8f2" }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
    padding: "0.9rem 0.6rem", background: bg, border: `1.5px solid ${color}22`,
    borderRadius: "12px", cursor: "pointer", flex: 1, minWidth: 0,
    transition: "all 0.18s", color: color, fontFamily: "inherit",
  }}
    onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = color; }}
    onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = `${color}22`; }}
  >
    <span style={{ fontSize: "1.4rem" }}>{icon}</span>
    <span style={{ fontSize: "0.72rem", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
  </button>
);

const RevenueRow = ({ label, amount, max, color, icon }) => {
  const pct = max > 0 ? Math.min((amount / max) * 100, 100) : 0;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.75rem" }}>{icon}</span>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: C.muted }}>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: color }}>
          ₹{typeof amount === "number" ? amount.toLocaleString("en-IN") : "—"}
        </Typography>
      </Box>
      <Box sx={{ height: 5, background: "#f0ebe4", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </Box>
    </Box>
  );
};

// ─── Main Calendar ────────────────────────────────────────────────────────────
function BookingCalendar({ totalRooms, language, blockPeriods = [] }) {
  const t = L[language] ?? L.en;
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dayData, setDayData] = useState({}); // { "2026-04-12": { booked, blocked, blockReason, blockBy } }
  const [loading, setLoading] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);
  const [clickDay, setClickDay] = useState(null);
  const [clickBookings, setClickBookings] = useState([]);
  const [clickLoading, setClickLoading] = useState(false);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results = {};

    try {
      // Search all bookings for the month to build per-day counts
      const start = toLocalDt(new Date(year, month, 1, 0, 0));
      const end   = toLocalDt(new Date(year, month, daysInMonth, 23, 59));

      const res = await searchBookings({
        fromDate: start, toDate: end,
      });

      const bookings = res.data || [];

      // For each day, count bookings that overlap
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${pad(month + 1)}-${pad(d)}`;
        const dayStart = new Date(year, month, d, 0, 0).getTime();
        const dayEnd   = new Date(year, month, d, 23, 59).getTime();

        const booked = bookings.filter(b => {
          if (b.status === "CANCELLED" || b.status === "ROOM_SHIFTED") return false;
          // Count booking on its check-in date only
          const ci = Array.isArray(b.scheduledCheckIn)
            ? new Date(b.scheduledCheckIn[0], b.scheduledCheckIn[1]-1, b.scheduledCheckIn[2])
            : new Date(b.scheduledCheckIn);
          return ci.getFullYear() === year &&
                 ci.getMonth()    === month &&
                 ci.getDate()     === d;
        }).length;

        results[key] = { booked, blocked: false };
      }
    } catch (e) {
      console.error("Calendar load failed", e);
    }

    // Overlay block periods on the calendar
    const parseDate = (v) => {
      if (!v) return null;
      if (Array.isArray(v)) return new Date(v[0], v[1]-1, v[2]);
      return new Date(v);
    };
    blockPeriods.forEach(bp => {
      const from = parseDate(bp.blockFrom);
      const to   = parseDate(bp.blockTo);
      if (!from || !to) return;
      const cur = new Date(from);
      while (cur <= to) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          const k = `${year}-${pad(cur.getMonth()+1)}-${pad(cur.getDate())}`;
          results[k] = { ...(results[k] || { booked: 0 }), blocked: true, blockReason: bp.reason, blockBy: bp.blockedBy };
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    setDayData(results);
    setLoading(false);
  }, [year, month, blockPeriods]);

  useEffect(() => { loadMonthData(); }, [loadMonthData]);

  const handleDayClick = async (dateKey, dayBookings) => {
    setClickDay(dateKey);
    setClickLoading(true);
    try {
      const [y, m, d] = dateKey.split("-").map(Number);
      const start = toLocalDt(new Date(y, m-1, d, 0, 0));
      const end   = toLocalDt(new Date(y, m-1, d, 23, 59));
      const res = await searchBookings({ fromDate: start, toDate: end });
      setClickBookings((res.data || []).filter(b => b.status !== "CANCELLED" && b.status !== "ROOM_SHIFTED"));
    } catch { setClickBookings([]); }
    setClickLoading(false);
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow    = new Date(year, month, 1).getDay(); // 0=Sun
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayLabels = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
  const monthNames = language === "hi"
    ? ["जन","फर","मार","अप्र","मई","जून","जुल","अग","सित","अक्ट","नव","दिस"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const occupancyColor = (booked, total) => {
    if (!total) return C.muted;
    const pct = booked / total;
    if (pct === 0) return C.green;
    if (pct < 0.5) return C.green;
    if (pct < 0.85) return C.yellow;
    return C.red;
  };
  const occupancyBg = (booked, total) => {
    if (!total) return "#f5f5f5";
    const pct = booked / total;
    if (pct === 0) return C.greenBg;
    if (pct < 0.5) return C.greenBg;
    if (pct < 0.85) return C.yellowBg;
    return C.redBg;
  };

  return (
    <Box>
      {/* Calendar header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "0.8rem" }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: C.text }}>
          {monthNames[month]} {year}
        </Typography>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
            width: 30, height: 30, cursor: "pointer", fontSize: "0.9rem", color: C.accent, fontWeight: 700,
          }}>‹</button>
          <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} style={{
            background: C.accent, border: "none", borderRadius: 6, padding: "0 0.7rem",
            height: 30, cursor: "pointer", fontSize: "0.7rem", color: "#fff", fontWeight: 700,
          }}>{language === "hi" ? "आज" : "Today"}</button>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
            width: 30, height: 30, cursor: "pointer", fontSize: "0.9rem", color: C.accent, fontWeight: 700,
          }}>›</button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} sx={{ color: C.accent }} /></Box>
      ) : (
        <>
          {/* Day labels */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", mb: "3px" }}>
            {dayLabels.map(dl => (
              <Box key={dl} sx={{ textAlign: "center", py: "0.3rem" }}>
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{dl}</Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar cells */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
            {cells.map((day, i) => {
              if (!day) return <Box key={`empty-${i}`} />;
              const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
              const data = dayData[dateKey] || { booked: 0, blocked: false };
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isPast = new Date(year, month, day) < startOfDay(today);
              const color = data.blocked ? C.muted : occupancyColor(data.booked, totalRooms);
              const bg    = data.blocked ? "#f0f0f0" : (isPast ? "#faf8f5" : occupancyBg(data.booked, totalRooms));
              const isClicked = clickDay === dateKey;

              return (
                <Box
                  key={dateKey}
                  onClick={() => handleDayClick(dateKey, data)}
                  onMouseEnter={() => setHoverDay(dateKey)}
                  onMouseLeave={() => setHoverDay(null)}
                  sx={{
                    background: isClicked ? color : bg,
                    borderRadius: "8px",
                    border: `1.5px solid ${isToday ? C.accent : isClicked ? color : C.border}`,
                    p: "0.35rem 0.25rem",
                    cursor: "pointer",
                    minHeight: "3.2rem",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                    position: "relative",
                    transition: "all 0.15s",
                    opacity: isPast ? 0.7 : 1,
                    "&:hover": { borderColor: color, transform: "scale(1.04)", zIndex: 2, boxShadow: "0 3px 10px rgba(0,0,0,0.12)" },
                  }}
                >
                  <Typography sx={{
                    fontSize: "0.75rem", fontWeight: isToday ? 800 : 600,
                    color: isClicked ? "#fff" : (isToday ? C.accent : C.text),
                    textDecoration: data.blocked ? "line-through" : "none",
                  }}>{day}</Typography>

                  {!data.blocked && totalRooms > 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: isClicked ? "#fff" : color }}>
                        {data.booked}/{totalRooms}
                      </Typography>
                      {/* Mini bar */}
                      <Box sx={{ width: "80%", height: 3, background: "#00000015", borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ width: `${totalRooms > 0 ? (data.booked / totalRooms) * 100 : 0}%`, height: "100%", background: isClicked ? "#fff8" : color, borderRadius: 2, transition: "width 0.3s" }} />
                      </Box>
                    </Box>
                  )}

                  {data.blocked && (
                    <Box title={data.blockReason ? `${data.blockReason}${data.blockBy ? ` (${data.blockBy})` : ""}` : (language === "hi" ? "ब्लॉक्ड" : "Blocked")}>
                      <Typography sx={{ fontSize: "0.55rem", color: C.muted, fontWeight: 600, textAlign: "center" }}>
                        🔒
                      </Typography>
                      {data.blockReason && (
                        <Typography sx={{ fontSize: "0.48rem", color: C.muted, textAlign: "center", lineHeight: 1, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {data.blockReason.slice(0, 8)}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {isToday && (
                    <Box sx={{ position: "absolute", bottom: 2, width: 5, height: 5, borderRadius: "50%", background: C.accent }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Legend */}
      <Box sx={{ display: "flex", gap: "1rem", mt: "0.8rem", flexWrap: "wrap" }}>
        {[
          { color: C.green,  bg: C.greenBg,  label: language === "hi" ? "कम व्यस्त" : "Low" },
          { color: C.yellow, bg: C.yellowBg, label: language === "hi" ? "मध्यम" : "Medium" },
          { color: C.red,    bg: C.redBg,    label: language === "hi" ? "भरा हुआ" : "Full" },
        ].map(({ color, bg, label }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1.5px solid ${color}` }} />
            <Typography sx={{ fontSize: "0.65rem", color: C.muted }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Day detail popup */}
      {clickDay && (
        <Box sx={{
          mt: "1rem", p: "1rem", background: "#fdf9f4", borderRadius: "10px",
          border: `1px solid ${C.border}`, position: "relative",
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "0.6rem" }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: C.text }}>
              📅 {clickDay}
            </Typography>
            <button onClick={() => setClickDay(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: C.muted }}>✕</button>
          </Box>
          {clickLoading ? (
            <CircularProgress size={16} sx={{ color: C.accent }} />
          ) : clickBookings.length === 0 ? (
            <Typography sx={{ fontSize: "0.75rem", color: C.muted }}>{language === "hi" ? "कोई बुकिंग नहीं" : "No bookings"}</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {clickBookings.map(b => {
                const statusColor = b.status === "CHECKED_IN" ? C.green : b.status === "BOOKED" ? C.accent : C.muted;
                return (
                  <Box key={b.bookingNumber} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: "0.4rem 0.6rem", background: "#fff", borderRadius: 6, border: `1px solid ${C.border}` }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{b.bookingNumber}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: C.muted }}>{b.customerName} · {language === "hi" ? "कक्ष" : "Rm"} {b.roomNumber}</Typography>
                    </Box>
                    <Box sx={{ px: "0.5rem", py: "0.15rem", borderRadius: 4, background: `${statusColor}18` }}>
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: statusColor }}>{b.status}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BhaktNiwasDashboard() {
  const { auth, language } = useAuth();
  const navigate = useNavigate();
  const t = L[language] ?? L.en;

  const [rooms, setRooms]             = useState([]);
  const [revenue, setRevenue]         = useState({ daily: null, weekly: null, monthly: null });
  const [todayBookings, setTodayBookings] = useState({ checkins: 0, checkouts: 0 });
  const [blockPeriods, setBlockPeriods]     = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const now = new Date();
    try {
      const now2 = new Date();
      const monthStr = `${now2.getFullYear()}-${pad(now2.getMonth()+1)}`;
      const [roomsRes, blocksRes] = await Promise.all([
        getRooms(),
        getBlocksForMonth(monthStr).catch(() => ({ data: [] })),
      ]);
      setRooms(roomsRes);
      setBlockPeriods(blocksRes.data || []);

      // Revenue: daily, weekly, monthly in parallel
      const dayStart  = toLocalDt(startOfDay(now));
      const dayEnd    = toLocalDt(endOfDay(now));
      const weekStart = toLocalDt(startOfWeek());
      const monStart  = toLocalDt(startOfMonth());

      const [dayRev, weekRev, monRev] = await Promise.all([
        getRevenueReport(null, dayStart, dayEnd),
        getRevenueReport(null, weekStart, dayEnd),
        getRevenueReport(null, monStart, dayEnd),
      ]);

      setRevenue({
        daily:   dayRev.data?.totalRent  ?? 0,
        weekly:  weekRev.data?.totalRent ?? 0,
        monthly: monRev.data?.totalRent  ?? 0,
      });

      // Search with a wide window to catch all currently CHECKED_IN guests
      // (guests who checked in days ago are still occupying rooms)
      const wideStart = toLocalDt(new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0));
      const [todayRes, activeRes] = await Promise.all([
        searchBookings({ fromDate: dayStart, toDate: dayEnd }),
        searchBookings({ fromDate: wideStart, toDate: dayEnd }),
      ]);
      const todayList  = todayRes.data  || [];
      const activeList = activeRes.data || [];
      setTodayBookings({
        checkins:       todayList.filter(b => b.status === "CHECKED_IN").length,
        checkouts:      todayList.filter(b => b.status === "CHECKED_OUT").length,
        currentlyIn:    activeList.filter(b => b.status === "CHECKED_IN").length,
      });

    } catch (e) { console.error("Dashboard load failed", e); }
    setLoading(false);
  };

  // Derive all metrics consistently from rooms list
  const totalRooms     = rooms.length;
  // "Occupied" = rooms that have a CHECKED_IN booking right now
  // We use todayBookings checkins as proxy — but better: count from rooms that are AVAILABLE
  // but have active booking. Since room.status doesn't track booking, we use:
  // occupied = rooms where status is not AVAILABLE and not MAINTENANCE (i.e. physically occupied)
  // Actually simplest truth: occupied = todayBookings checkins count
  // currentlyIn = guests physically in rooms right now (checked in but not yet checked out)
  const occupiedRooms  = todayBookings.currentlyIn ?? 0;
  const availableRooms = totalRooms - occupiedRooms;
  const occupancyPct   = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;



  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 2 }}>
      <CircularProgress sx={{ color: C.accent }} />
      <Typography sx={{ color: C.muted, fontSize: "0.85rem" }}>{t.loading}</Typography>
    </Box>
  );

  return (
    <Box sx={{ background: C.bg, minHeight: "100vh", p: "1.2rem", fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── Header ── */}
      <Box sx={{ mb: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.title}</Typography>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{t.subtitle}</Typography>
        </Box>
        <Typography sx={{ fontSize: "0.72rem", color: C.muted }}>
          {new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </Typography>
      </Box>

      {/* ── Metrics Row ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.7rem", mb: "1.2rem" }}>
        <MetricCard label={t.totalRooms}     value={totalRooms}     icon="🏠" color={C.accent}  />
        <MetricCard label={t.occupied}       value={occupiedRooms}  icon="🔴" color={C.red}     bg={occupiedRooms > 0 ? C.redBg : C.card} />
        <MetricCard label={t.available}      value={availableRooms} icon="🟢" color={C.green}   bg={availableRooms > 0 ? C.greenBg : C.card} />
        <MetricCard label={t.occupancy}      value={`${occupancyPct.toFixed(0)}%`} icon="📊" color={occupancyPct > 80 ? C.red : occupancyPct > 50 ? C.yellow : C.green} />
        <MetricCard label={t.todayCheckins}  value={todayBookings.checkins}  icon="✅" color={C.blue}   bg={C.blueBg} />
        <MetricCard label={t.todayCheckouts} value={todayBookings.checkouts} icon="🚪" color={C.muted} />
      </Box>

      {/* ── Main Grid ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 280px)", gap: "1rem", overflow: "hidden" }}>

        {/* LEFT: Calendar */}
        <Box sx={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, p: "1.2rem", boxShadow: "0 2px 12px rgba(139,100,60,0.07)" }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", mb: "0.8rem" }}>
            📅 {t.calendar}
          </Typography>
          <BookingCalendar totalRooms={totalRooms} language={language} blockPeriods={blockPeriods} />
        </Box>

        {/* RIGHT: Actions + Revenue */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Revenue FIRST */}
          <Box sx={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, p: "1.1rem", boxShadow: "0 2px 12px rgba(139,100,60,0.07)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "1rem" }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                💰 {t.revenue}
              </Typography>
              <Typography sx={{ fontSize: "0.6rem", color: C.muted }}>
                {language === "hi" ? "आज / सप्ताह / माह" : "Today / Week / Month"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <RevenueRow
                label={t.daily}
                amount={revenue.daily ?? 0}
                max={revenue.monthly ?? 1}
                color={C.accent}
                icon="☀️"
              />
              <RevenueRow
                label={t.weekly}
                amount={revenue.weekly ?? 0}
                max={revenue.monthly ?? 1}
                color={C.saffron}
                icon="📅"
              />
              <RevenueRow
                label={t.monthly}
                amount={revenue.monthly ?? 0}
                max={revenue.monthly ?? 1}
                color={C.green}
                icon="📆"
              />
            </Box>
            {/* Total summary line */}
            <Box sx={{ mt: "1rem", pt: "0.7rem", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: "0.65rem", color: C.muted }}>{language === "hi" ? "मासिक कुल" : "Monthly Total"}</Typography>
              <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: C.accent }}>
                ₹{typeof revenue.monthly === "number" ? revenue.monthly.toLocaleString("en-IN") : "—"}
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, p: "1.1rem", boxShadow: "0 2px 12px rgba(139,100,60,0.07)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", mb: "0.8rem" }}>
              ⚡ {language === "hi" ? "त्वरित कार्रवाई" : "Quick Actions"}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", mb: "0.5rem" }}>
              <ActionBtn icon="➕" label={t.newBooking}  onClick={() => navigate("/rooms/bookings")} color={C.accent} bg="#fff8f2" />
              <ActionBtn icon="🔑" label={t.checkIn}    onClick={() => navigate("/rooms/bookings")} color={C.green}  bg={C.greenBg} />
              <ActionBtn icon="🚪" label={t.checkOut}   onClick={() => navigate("/rooms/bookings")} color={C.red}    bg={C.redBg} />
              <ActionBtn icon="📅" label={t.findRoom}   onClick={() => navigate("/rooms/bookings")} color={C.blue}   bg={C.blueBg} />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <ActionBtn icon="🔒" label={t.blockRoom}   onClick={() => navigate("/rooms/bookings")} color={C.muted}   bg="#f5f5f5" />
              <ActionBtn icon="⚙️" label={t.manageRooms} onClick={() => navigate("/inventory/rooms")} color={C.accentDk} bg="#fff3e8" />
            </Box>
          </Box>

          {/* Occupancy bar */}
          <Box sx={{ background: C.card, borderRadius: "14px", border: `1px solid ${C.border}`, p: "1.1rem", boxShadow: "0 2px 12px rgba(139,100,60,0.07)" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", mb: "0.8rem" }}>
              🏠 {language === "hi" ? "कमरा स्थिति" : "Room Status"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {rooms.slice(0, 8).map(r => {
                const statusLabel =
                  r.status === "MAINTENANCE" ? (language === "hi" ? "रखरखाव" : "Maint.") :
                  r.cleaningStatus === "DIRTY" ? (language === "hi" ? "गंदा" : "Dirty") :
                  r.cleaningStatus === "CLEANING_IN_PROGRESS" ? (language === "hi" ? "सफाई" : "Clean..") :
                  (language === "hi" ? "खाली" : "Free");
                const statusColor2 =
                  r.status === "MAINTENANCE" ? C.yellow :
                  (r.cleaningStatus === "DIRTY" || r.cleaningStatus === "CLEANING_IN_PROGRESS") ? C.saffron :
                  C.green;
                const statusBg2 =
                  r.status === "MAINTENANCE" ? C.yellowBg :
                  (r.cleaningStatus === "DIRTY" || r.cleaningStatus === "CLEANING_IN_PROGRESS") ? C.yellowBg :
                  C.greenBg;
                return (
                  <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: C.text, minWidth: "2.5rem" }}>{r.roomNumber}</Typography>
                    <Box sx={{ flex: 1, height: 6, background: "#f0ebe4", borderRadius: 3, overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: r.status === "MAINTENANCE" ? "100%" : (r.cleaningStatus !== "CLEAN" ? "60%" : "0%"), background: statusColor2, borderRadius: 3, transition: "width 0.4s" }} />
                    </Box>
                    <Box sx={{ px: "0.4rem", py: "0.1rem", borderRadius: 3, minWidth: "3.5rem", textAlign: "center", background: statusBg2 }}>
                      <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: statusColor2 }}>
                        {statusLabel}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {rooms.length > 8 && (
                <Typography sx={{ fontSize: "0.65rem", color: C.muted, textAlign: "center" }}>
                  +{rooms.length - 8} {language === "hi" ? "और कमरे" : "more rooms"}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
