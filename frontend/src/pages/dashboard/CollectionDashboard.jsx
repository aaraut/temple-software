import { useEffect, useState } from "react";
import {
    Box, Typography, MenuItem, Select, FormControl, InputLabel,
    CircularProgress, Button, TextField, Divider, Chip, Avatar,
    ToggleButton, ToggleButtonGroup, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../api/dashboardApi";
import { getRevenueReport } from "../../api/roomBookingApi";
import { listUsers } from "../../api/userApi";
import { useNavigate } from "react-router-dom";

/* ─── i18n ───────────────────────────────────────────────────── */
const L = {
    en: {
        title: "Collection Summary", period: "Period",
        daily: "Daily", weekly: "Weekly", monthly: "Monthly",
        allUsers: "All Users", user: "User",
        searchReceipt: "Search Donation",
        rentalSearch: "Search Rental",
        printDaily: "Print Report",
        donationCollection: "Donation Collection",
        receipts: "Receipts",
        rentalCollection: "Rental Collection",
        rentalBartan: "Bartan Rental", rentalBichayat: "Bichayat Rental",
        bhaktNiwasTitle: "Bhakt Niwas", bhaktNiwasRent: "Room Rent",
        bhaktNiwasDeposit: "Deposit", bhaktNiwasDeduction: "Deduction",
        bhaktNiwasBookings: "Bookings",
        transactions: "Txn", rent: "Rent", deposit: "Deposit",
        totalCollection: "Total Collection", totalDeposit: "Total Deposits",
        goshalaDaan: "Goshala Daan", printGoshala: "Print Goshala Report",
        reportDate: "Report Date", filters: "Filters",
        grandTotal: "Grand Total", clickForDetails: "Click for details",
    },
    hi: {
        title: "कलेक्शन संक्षिप्त विवरण", period: "अवधि",
        daily: "दैनिक", weekly: "साप्ताहिक", monthly: "मासिक",
        allUsers: "सभी यूज़र", user: "यूज़र",
        searchReceipt: "दान रसीद खोजें",
        rentalSearch: "किराया रसीद खोजें",
        printDaily: "रिपोर्ट प्रिंट",
        donationCollection: "दान कलेक्शन",
        receipts: "रसीदें",
        rentalCollection: "किराया कलेक्शन",
        rentalBartan: "बर्तन किराया", rentalBichayat: "बिछायत किराया",
        bhaktNiwasTitle: "भक्त निवास", bhaktNiwasRent: "कक्ष किराया",
        bhaktNiwasDeposit: "जमानत", bhaktNiwasDeduction: "कटौती",
        bhaktNiwasBookings: "बुकिंग",
        transactions: "लेन", rent: "किराया", deposit: "जमा",
        totalCollection: "कुल कलेक्शन", totalDeposit: "कुल जमा",
        goshalaDaan: "गौशाला दान", printGoshala: "गौशाला रिपोर्ट प्रिंट",
        reportDate: "रिपोर्ट दिनांक", filters: "फ़िल्टर",
        grandTotal: "कुल योग", clickForDetails: "विवरण के लिए क्लिक",
    },
};

/* ─── helpers ────────────────────────────────────────────────── */
const fmt = (v) => Number(v || 0).toLocaleString("en-IN");
const fmtDate = (s) => { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
};

/* colour palette per donation-purpose index */
const CARD_ACCENTS = [
    "#E07B54", "#F7C59F", "#EFEFD0", "#004E89",
    "#1A936F", "#C6AC8F", "#E84855", "#3A86FF",
    "#8338EC", "#FB5607",
];

/* ─── sub-components ─────────────────────────────────────────── */

function StatBadge({ label, value, accent = "#E07B54", icon }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.2, px: 1.5, borderRadius: 2, background: `${accent}18`, border: `1.5px solid ${accent}40` }}>
            <Avatar sx={{ bgcolor: accent, width: 36, height: 36 }}>{icon}</Avatar>
            <Box>
                <Typography sx={{ fontSize: 11, color: "#5a4a3a", fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: accent, lineHeight: 1.3 }}>₹ {fmt(value)}</Typography>
            </Box>
        </Box>
    );
}

function DonationCard({ item, accent, receiptsLabel, clickLabel, onClick }) {
    return (
        <Box onClick={onClick} sx={{
            borderRadius: "12px", cursor: "pointer", overflow: "hidden",
            border: `2px solid ${accent}`,
            background: `${accent}18`,
            boxShadow: `0 3px 14px ${accent}22`,
            transition: "all 0.18s ease", display: "flex", flexDirection: "column",
            "&:hover": { boxShadow: `0 10px 32px ${accent}40`, transform: "translateY(-3px)", background: `${accent}28` },
        }}>
            <Box sx={{ height: 7, background: accent, flexShrink: 0 }} />
            <Box sx={{ p: "14px 14px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: "3px", color: "#1a1a2e" }}>{item.purpose}</Typography>
                <Typography sx={{ fontSize: 11, color: "#4a3a2a", mb: "10px", fontWeight: 700 }}>
                    {receiptsLabel}: <span style={{ fontWeight: 900 }}>{item.receiptCount ?? 0}</span>
                </Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1, mt: "auto" }}>
                    ₹{fmt(item.amount)}
                </Typography>
                <Typography sx={{ fontSize: 11, color: accent, mt: "6px", fontWeight: 800 }}>{clickLabel} →</Typography>
            </Box>
        </Box>
    );
}

function RentalCard({ title, data, t, accent }) {
    return (
        <Box sx={{
            borderRadius: "12px", border: `2px solid ${accent}`,
            background: "#fff", overflow: "hidden",
            boxShadow: `0 3px 14px ${accent}22`, display: "flex", flexDirection: "column",
        }}>
            <Box sx={{ height: 7, background: accent, flexShrink: 0 }} />
            <Box sx={{ p: "14px 14px 14px", flex: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: "14px", color: "#1a1a2e" }}>{title}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                        { label: t.transactions, value: data?.transactions ?? 0, prefix: "" },
                        { label: t.rent,         value: fmt(data?.rentTotal),    prefix: "₹" },
                        { label: t.deposit,      value: fmt(data?.depositTotal), prefix: "₹" },
                    ].map(({ label, value, prefix }) => (
                        <Box key={label} sx={{ textAlign: "center", py: "10px", px: "4px", borderRadius: "8px", background: `${accent}18`, border: `1.5px solid ${accent}35` }}>
                            <Typography sx={{ fontSize: 10, color: "#4a3a2a", mb: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
                            <Typography sx={{ fontSize: 18, fontWeight: 900, color: accent, lineHeight: 1 }}>{prefix}{value}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

/* ─── PRINT helpers (unchanged logic) ───────────────────────── */
const buildPrintMain = (printData, reportDateFormatted, userLabel, fmt2) => {
    const donationRows = printData?.donations?.map((d) =>
        `<tr><td>${d.purposeHi || d.purpose}</td><td>${d.receiptCount || 0}</td><td>&#8377; ${fmt2(d.amount)}</td></tr>`
    ).join("") || "";

    return `<html><head>
<meta charset="UTF-8">
<title>Daily Cash Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
  body{font-family:'Noto Sans Devanagari',Arial,sans-serif;padding:20px;font-size:14px}
  .header{text-align:center;margin-bottom:10px}.header h2{margin:5px 0}.sub{font-size:13px}
  .section-title{font-weight:bold;margin-top:15px;margin-bottom:5px}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  table,th,td{border:1px solid black}th,td{padding:6px;text-align:left}
  .total-box{width:50%;margin-top:15px}
  .signature{margin-top:50px;display:flex;justify-content:space-between}
  .sign-box{width:40%;border-top:1px solid black;text-align:center;padding-top:8px}
  @media print{body{margin:0}}
</style>
</head><body>
<div class="header">
  <h2>चमत्कारिक श्री हनुमान मंदिर ट्रस्ट समिति</h2>
  <div class="sub">जामसावली, ता. सौसर, जि. छिंदवाड़ा (म. प्र.)</div>
  <div class="sub">Reg. No: 48/90 | URN: AABTC40DICF2023 | Email: jamsawlimandir@gmail.com</div>
  <h3>दैनिक नगद विवरण</h3>
  <div>दिनांक: ${reportDateFormatted}</div><div>यूज़र: ${userLabel}</div>
</div>
<div class="section-title">दान कलेक्शन</div>
<table><thead><tr><th>उद्देश्य</th><th>रसीद संख्या</th><th>राशि</th></tr></thead><tbody>${donationRows}</tbody></table>
<div class="section-title">किराया कलेक्शन</div>
<table>
  <tr><td><strong>बर्तन किराया</strong></td><td>लेनदेन: ${printData?.rentalBartan?.transactions || 0}</td><td>&#8377; ${fmt2(printData?.rentalBartan?.rentTotal)}</td></tr>
  <tr><td><strong>बिछायत किराया</strong></td><td>लेनदेन: ${printData?.rentalBichayat?.transactions || 0}</td><td>&#8377; ${fmt2(printData?.rentalBichayat?.rentTotal)}</td></tr>
</table>
<div class="section-title">भक्त निवास (कक्ष किराया)</div>
<table>
  <tr><th>विवरण</th><th>राशि</th></tr>
  <tr><td>कक्ष किराया (आज)</td><td>&#8377; ${fmt2(printData?.bhaktNiwas?.totalRent)}</td></tr>
  <tr><td>जमानत राशि प्राप्त</td><td>&#8377; ${fmt2(printData?.bhaktNiwas?.depositCollected)}</td></tr>
  <tr><td>जमानत कटौती</td><td>&#8377; ${fmt2(printData?.bhaktNiwas?.depositDeducted)}</td></tr>
</table>
<div class="section-title">संक्षिप्त विवरण</div>
<table class="total-box">
  <tr><td><strong>कुल कलेक्शन राशि</strong></td><td>&#8377; ${fmt2(printData?.collectionTotal)}</td></tr>
  <tr><td><strong>भक्त निवास किराया</strong></td><td>&#8377; ${fmt2(printData?.bhaktNiwas?.totalRent)}</td></tr>
  <tr><td><strong>कुल जमा राशि (डिपॉजिट)</strong></td><td>&#8377; ${fmt2((printData?.depositTotal ?? 0) + (printData?.bhaktNiwas?.depositCollected ?? 0))}</td></tr>
  <tr><td><strong>समग्र कुल</strong></td><td><strong>&#8377; ${fmt2((printData?.collectionTotal ?? 0) + (printData?.bhaktNiwas?.totalRent ?? 0))}</strong></td></tr>
</table>
<div class="signature">
  <div class="sign-box">जमाकर्ता के हस्ताक्षर</div>
  <div class="sign-box">प्राप्तकर्ता के हस्ताक्षर</div>
</div>
<script>window.print();</script></body></html>`;
};

const buildPrintGoshala = (printData, reportDateFormatted, userLabel, fmt2) =>
    `<html><head>
<meta charset="UTF-8">
<title>Goshala Daan Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
  body{font-family:'Noto Sans Devanagari',Arial,sans-serif;padding:30px;font-size:14px}
  .header{text-align:center;margin-bottom:20px}.header h2{margin:3px 0}
  table{width:100%;border-collapse:collapse;margin-top:15px}
  table,th,td{border:1px solid black}th,td{padding:8px;text-align:left}
  .signature{margin-top:70px;display:flex;justify-content:space-between}
  .sign-box{width:40%;border-top:1px dotted black;text-align:center;padding-top:8px}
  @media print{body{margin:0}}
</style>
</head><body>
<div class="header">
  <h2>श्री बजरंग गोशाला</h2>
  <h2>चमत्कारिक श्री हनुमान मंदिर संस्थान (हनुमान लोक)</h2>
  <div>सौसर, तह. सौसर जि. पांढुर्णा (म. प्र.)</div>
  <div>रजि.नं.: 658 / 04 | ईमेल: jamsawlimandir@gmail.com</div>
  <h3 style="margin-top:15px;">दैनिक नगद विवरण</h3>
  <div>दिनांक: ${reportDateFormatted}</div><div>यूज़र: ${userLabel}</div>
</div>
<table>
  <tr><th>गौशाला दान खाते</th><th>राशि</th></tr>
  <tr><td>${printData?.goshalaDaan?.purposeHi || "गौशाला दान"}</td><td>&#8377; ${fmt2(printData?.goshalaDaan?.amount)}</td></tr>
  <tr><td><strong>कुल राशि</strong></td><td><strong>&#8377; ${fmt2(printData?.goshalaDaan?.amount)}</strong></td></tr>
</table>
<div class="signature">
  <div class="sign-box">जमाकर्ता के हस्ताक्षर</div>
  <div class="sign-box">प्राप्तकर्ता के हस्ताक्षर</div>
</div>
<script>window.print();</script></body></html>`;

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function CollectionDashboard() {
    const { auth, language } = useAuth();
    const t = L[language] ?? L.en;
    const navigate = useNavigate();

    const [period, setPeriod] = useState("DAILY");
    const [selectedUser, setSelectedUser] = useState("ALL");
    const [data, setData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printDate, setPrintDate] = useState(today());

    const isAdmin = auth?.role === "ADMIN";

    useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);
    useEffect(() => { fetchData(); }, [period]);

    const loadUsers = async () => {
        try { const l = await listUsers(); setUsers(l.filter((u) => u.active)); }
        catch (e) { console.error(e); }
    };

    const fetchData = async (user = selectedUser) => {
        try {
            setLoading(true);
            // Determine date range from period
            const now = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
            const weekStart = (() => { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })();
            const monthStart = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
            const start = period === "WEEKLY" ? weekStart : period === "MONTHLY" ? monthStart : todayStr;
            const [summaryRes, bhaktRes] = await Promise.all([
                getDashboardSummary(period, user, auth.username, auth.role),
                getRevenueReport(
                    isAdmin && user === "ALL" ? null : (isAdmin ? user : auth.username),
                    start + "T00:00", todayStr + "T23:59"
                ).catch(() => ({ data: { totalRent: 0, depositCollected: 0, depositDeducted: 0 } })),
            ]);
            setData({
                ...summaryRes.data,
                bhaktNiwas: {
                    totalRent:        bhaktRes.data?.totalRent        ?? 0,
                    depositCollected: bhaktRes.data?.depositCollected ?? 0,
                    depositDeducted:  bhaktRes.data?.depositDeducted  ?? 0,
                },
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchDataForDate = async (dateStr) => {
        try {
            const u = isAdmin ? selectedUser : auth.username;
            const [summaryRes, bhaktRes] = await Promise.all([
                getDashboardSummary("DAILY", u, auth.username, auth.role, dateStr),
                getRevenueReport(
                    isAdmin && u === "ALL" ? null : (isAdmin ? u : auth.username),
                    dateStr + "T00:00",
                    dateStr + "T23:59"
                ).catch(() => ({ data: { totalRent: 0, depositCollected: 0, depositDeducted: 0 } })),
            ]);
            return {
                ...summaryRes.data,
                bhaktNiwas: {
                    totalRent:        bhaktRes.data?.totalRent        ?? 0,
                    depositCollected: bhaktRes.data?.depositCollected ?? 0,
                    depositDeducted:  bhaktRes.data?.depositDeducted  ?? 0,
                },
            };
        } catch (e) { console.error(e); return data; }
    };

    const resolveUserLabel = () =>
        isAdmin
            ? (selectedUser === "ALL" ? (language === "hi" ? "सभी यूज़र" : "All Users") : selectedUser)
            : auth.username;

    const handleCardClick = (purpose) =>
        navigate(`/reports/details?purpose=${purpose}&period=${period}&user=${selectedUser}`);

    const handlePrintReport = async () => {
        const pd = await fetchDataForDate(printDate);
        const w = window.open("", "_blank");
        w.document.write(buildPrintMain(pd, fmtDate(printDate), resolveUserLabel(), fmt));
        w.document.close();
    };

    const handlePrintGoshala = async () => {
        const pd = await fetchDataForDate(printDate);
        const w = window.open("", "_blank");
        w.document.write(buildPrintGoshala(pd, fmtDate(printDate), resolveUserLabel(), fmt));
        w.document.close();
    };

    /* ── totals ── */
    const donationTotal = data?.collectionTotal ?? 0;
    const depositTotal = data?.depositTotal ?? 0;
    const goshalaAmt = data?.goshalaDaan?.amount ?? 0;


    // ── colour helpers ─────────────────────────────────────────────────────────
    const acc = "#c8894a";
    const bg  = "#fdf9f4";
    const brd = "#e8ddd0";
    const txt = "#2d1f0f";
    const mut = "#8a7560";

    const ActionBtn = ({ icon, label, onClick, color = acc, bg2 = "#fff8f2" }) => (
        <button onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.6rem 1rem", background: bg2,
            border: `1.5px solid ${color}30`, borderRadius: 10,
            fontSize: "0.78rem", fontWeight: 700, color, cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
            onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.background = bg2; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = `${color}30`; }}
        >
            <span style={{ fontSize: "1rem" }}>{icon}</span> {label}
        </button>
    );

    return (
        <Box sx={{ background: bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* ── Top control bar ── */}
            <Box sx={{
                background: "#fff", borderBottom: `1px solid ${brd}`,
                px: "1.5rem", py: "0.9rem",
                display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
            }}>
                {/* Title */}
                <Box sx={{ mr: "auto" }}>
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: acc, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        {language === "hi" ? "मंदिर" : "Temple"}
                    </Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: txt, lineHeight: 1 }}>{t.title}</Typography>
                </Box>

                {/* Period pills */}
                <Box sx={{ display: "flex", background: "#fdf6ee", borderRadius: "10px", p: "0.2rem", border: `1px solid ${brd}` }}>
                    {[{ val: "DAILY", label: t.daily }, { val: "WEEKLY", label: t.weekly }, { val: "MONTHLY", label: t.monthly }].map(({ val, label }) => (
                        <button key={val} onClick={() => setPeriod(val)} style={{
                            padding: "0.4rem 0.9rem", border: "none", borderRadius: 8,
                            background: period === val ? `linear-gradient(135deg, ${acc}, #9a6030)` : "transparent",
                            color: period === val ? "#fff" : mut,
                            fontSize: "0.78rem", fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}>{label}</button>
                    ))}
                </Box>

                {/* User filter (admin) */}
                {isAdmin && (
                    <select
                        value={selectedUser}
                        onChange={e => { setSelectedUser(e.target.value); fetchData(e.target.value); }}
                        style={{
                            padding: "0.45rem 0.7rem", border: `1.5px solid ${brd}`, borderRadius: 9,
                            fontSize: "0.78rem", color: txt, background: "#fdf9f4",
                            fontFamily: "inherit", cursor: "pointer", outline: "none",
                        }}
                    >
                        <option value="ALL">{t.allUsers}</option>
                        {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                    </select>
                )}

                {/* Report date */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Typography sx={{ fontSize: "0.72rem", color: mut, fontWeight: 600 }}>{t.reportDate}:</Typography>
                    <input type="date" value={printDate} max={today()}
                        onChange={e => setPrintDate(e.target.value)} 
                        style={{ padding: "0.42rem 0.6rem", border: `1.5px solid ${brd}`, borderRadius: 9, fontSize: "0.78rem", color: txt, background: "#fdf9f4", fontFamily: "inherit", outline: "none" }} />
                </Box>

                {/* Action buttons */}
                <ActionBtn icon="🖨️" label={t.printDaily} onClick={handlePrintReport} color="#9a6030" bg2="#fff3e8" />
                <ActionBtn icon="🌿" label={t.printGoshala} onClick={handlePrintGoshala} color="#2d7a2d" bg2="#e8f5e8" />
                {/* Search buttons — pushed to right end */}
                <Box sx={{ ml: "auto", display: "flex", gap: "0.6rem" }}>
                    <ActionBtn icon="🔍" label={t.searchReceipt} onClick={() => navigate("/donation/search")} color={acc} bg2="#fff8f2" />
                    <ActionBtn icon="↩️" label={t.rentalSearch} onClick={() => navigate("/rentals/return")} color="#3A86FF" bg2="#f0f5ff" />
                </Box>
            </Box>

            {/* ── Summary cards ── */}
            <Box sx={{ px: "1.5rem", pt: "1.2rem", pb: "0.8rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.8rem" }}>
                {[
                    { label: t.totalCollection, value: donationTotal, color: "#E07B54", icon: "💰" },
                    { label: t.totalDeposit,    value: depositTotal,  color: "#3A86FF", icon: "🏦" },
                    { label: t.goshalaDaan,      value: goshalaAmt,    color: "#2d7a2d", icon: "🌿" },
                    { label: t.bhaktNiwasTitle,  value: data?.bhaktNiwas?.totalRent ?? 0, color: "#FF6B35", icon: "🏠" },
                ].map(({ label, value, color, icon }) => (
                    <Box key={label} sx={{ background: "#fff", borderRadius: "12px", p: "0.9rem 1.1rem", border: `1px solid ${brd}`, boxShadow: "0 1px 6px rgba(139,100,60,0.06)", position: "relative", overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: color, borderRadius: "12px 12px 0 0" }} />
                        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", mb: "0.3rem" }}>
                            <span style={{ fontSize: "0.9rem" }}>{icon}</span>
                            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: mut, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color, lineHeight: 1 }}>₹{fmt(value)}</Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Main content — 2 col: data + quick actions ── */}
            <Box sx={{ px: "1.5rem", pb: "2rem", display: "grid", gridTemplateColumns: "70% 30%", gap: "1.2rem", alignItems: "start" }}>

                {/* LEFT: all data */}
                <Box>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: acc }} /></Box>
                ) : (
                    <>
                        {/* Donation */}
                        <Box sx={{ mb: "1.5rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px" }}>
                                <Box sx={{ width: 4, height: 20, background: "#E07B54", borderRadius: 2 }} />
                                <Typography sx={{ fontWeight: 800, fontSize: 14, color: txt }}>{t.donationCollection}</Typography>
                                <Box sx={{ px: "8px", py: "1px", borderRadius: 20, background: "#E07B5425", border: "1.5px solid #E07B5460" }}>
                                    <Typography sx={{ fontSize: 11, color: "#E07B54", fontWeight: 800 }}>{data?.donations?.length ?? 0}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "12px", alignItems: "stretch" }}>
                                {data?.donations?.map((item, i) => (
                                    <DonationCard key={item.purpose} item={item} accent={CARD_ACCENTS[i % CARD_ACCENTS.length]}
                                        receiptsLabel={t.receipts} clickLabel={t.clickForDetails} onClick={() => handleCardClick(item.purpose)} />
                                ))}
                            </Box>
                        </Box>

                        {/* किराया + गौशाला + भक्त निवास */}
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "12px" }}>
                                <Box sx={{ width: 4, height: 20, background: "#3A86FF", borderRadius: 2 }} />
                                <Typography sx={{ fontWeight: 800, fontSize: 14, color: txt }}>{t.rentalCollection}</Typography>
                            </Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px", alignItems: "stretch" }}>
                                <RentalCard title={t.rentalBartan} data={data?.rentalBartan} t={t} accent="#3A86FF" />
                                <RentalCard title={t.rentalBichayat} data={data?.rentalBichayat} t={t} accent="#8338EC" />

                                {/* Goshala — same tinted style, clicks like Daan */}
                                <Box onClick={() => handleCardClick("GOSHALA_DAAN")} sx={{
                                    borderRadius: "12px", border: "2px solid #4caf50",
                                    background: "#4caf5018", overflow: "hidden",
                                    boxShadow: "0 3px 14px #4caf5022", display: "flex", flexDirection: "column",
                                    cursor: "pointer", transition: "all 0.18s",
                                    "&:hover": { boxShadow: "0 10px 32px #4caf5040", transform: "translateY(-3px)", background: "#4caf5028" },
                                }}>
                                    <Box sx={{ height: 7, background: "#4caf50", flexShrink: 0 }} />
                                    <Box sx={{ p: "14px", flex: 1, display: "flex", flexDirection: "column" }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 14, mb: "3px", color: "#1a1a2e" }}>{t.goshalaDaan}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#4a3a2a", mb: "10px", fontWeight: 700 }}>
                                            {t.receipts}: <span style={{ fontWeight: 900 }}>{data?.goshalaDaan?.receiptCount ?? 0}</span>
                                        </Typography>
                                        <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#4caf50", lineHeight: 1, mt: "auto" }}>
                                            ₹{fmt(data?.goshalaDaan?.amount ?? 0)}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "#4caf50", mt: "6px", fontWeight: 800 }}>{t.clickForDetails} →</Typography>
                                    </Box>
                                </Box>

                                {/* Bhakt Niwas */}
                                <Box sx={{ borderRadius: "12px", border: "2px solid #FF6B35", background: "#FF6B3518", overflow: "hidden", boxShadow: "0 3px 14px #FF6B3522", display: "flex", flexDirection: "column" }}>
                                    <Box sx={{ height: 7, background: "#FF6B35", flexShrink: 0 }} />
                                    <Box sx={{ p: "14px", flex: 1 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 14, mb: "14px", color: "#1a1a2e" }}>{t.bhaktNiwasTitle}</Typography>
                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                                            {[
                                                { label: t.bhaktNiwasRent,      value: `₹${fmt(data?.bhaktNiwas?.totalRent)}` },
                                                { label: t.bhaktNiwasDeposit,   value: `₹${fmt(data?.bhaktNiwas?.depositCollected)}` },
                                                { label: t.bhaktNiwasDeduction, value: `₹${fmt(data?.bhaktNiwas?.depositDeducted)}` },
                                            ].map(({ label, value }) => (
                                                <Box key={label} sx={{ textAlign: "center", py: "10px", px: "4px", borderRadius: "8px", background: "#FF6B3528", border: "1.5px solid #FF6B3550" }}>
                                                    <Typography sx={{ fontSize: 10, color: "#4a3a2a", mb: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
                                                    <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#FF6B35", lineHeight: 1 }}>{value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
                </Box>

                {/* RIGHT: Quick Actions sidebar */}
                <Box sx={{ background: "#fff", borderRadius: "16px", border: `1px solid ${brd}`, boxShadow: "0 4px 20px rgba(139,100,60,0.10)", overflow: "hidden", position: "sticky", top: "1rem" }}>
                    {/* Header */}
                    <Box sx={{ px: "1rem", py: "0.85rem", borderBottom: `1px solid ${brd}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: 14 }}>⚡</span>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#2d1f0f" }}>
                            {language === "hi" ? "त्वरित कार्रवाई" : "Quick Actions"}
                        </Typography>
                    </Box>
                    {/* 2-col tile grid */}
                    <Box sx={{ p: "0.8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                            { icon: "🙏", label: language === "hi" ? "दान करें"    : "New Donation",      path: "/donation",       color: "#E07B54", bg: "#fff5f0" },
                            { icon: "🍳", label: language === "hi" ? "बर्तन किराया"     : "Bartan Rental",     path: "/rentals/bartan",        color: "#3A86FF", bg: "#f0f5ff" },
                            { icon: "🛏️", label: language === "hi" ? "बिछायत किराया"   : "Bichayat Rental",   path: "/rentals/bichayat",      color: "#8338EC", bg: "#f5f0ff" }, 
                            { icon: "↩️", label: language === "hi" ? "किराया वापसी"     : "Rental Return",     path: "/rentals/return",        color: "#FB5607", bg: "#fff3ee" },
                            { icon: "🏠", label: language === "hi" ? "भक्त निवास"       : "Room Booking",      path: "/rooms/bookings",        color: "#FF6B35", bg: "#fff4f0" },
                            { icon: "📊", label: language === "hi" ? "रिपोर्ट"           : "Reports",            path: "/reports/admin-summary", color: "#2d7a2d", bg: "#f0fff0" },
                            { icon: "🌳", label: language === "hi" ? "गोत्र अपडेट"      : "Update Gotra",      path: "/gotra",          color: "#1A936F", bg: "#f0faf5" },
                            { icon: "🍶", label: language === "hi" ? "बर्तन सूची"       : "Bartan List",       path: "/inventory/bartan",      color: "#8a6030", bg: "#fdf8f0" },
                            { icon: "🛋️", label: language === "hi" ? "बिछायत सूची"     : "Bichayat List",     path: "/inventory/bichayat",    color: "#6B4226", bg: "#fdf5ee" },
                        ].map(({ icon, label, path, color, bg }) => (
                            <button key={path} onClick={() => navigate(path)} style={{
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                gap: "8px", padding: "20px 10px",
                                background: bg,
                                border: `1.5px solid ${color}25`,
                                borderRadius: "12px",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.18s",
                                minHeight: "110px",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 4px 16px ${color}30`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>{label}</span>
                            </button>
                        ))}
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}
