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
import { listUsers } from "../../api/userApi";
import { useNavigate } from "react-router-dom";

/* ─── i18n ───────────────────────────────────────────────────── */
const L = {
    en: {
        title: "Collection Summary", period: "Period",
        daily: "Daily", weekly: "Weekly", monthly: "Monthly",
        allUsers: "All Users", user: "User",
        searchReceipt: "Search Receipt",
        printDaily: "Print Report",
        donationCollection: "Donation Collection",
        receipts: "Receipts",
        rentalCollection: "Rental Collection",
        rentalBartan: "Bartan Rental", rentalBichayat: "Bichayat Rental",
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
        searchReceipt: "रसीद खोजें",
        printDaily: "रिपोर्ट प्रिंट",
        donationCollection: "दान कलेक्शन",
        receipts: "रसीदें",
        rentalCollection: "किराया कलेक्शन",
        rentalBartan: "बर्तन किराया", rentalBichayat: "बिछायत किराया",
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
const today = () => new Date().toISOString().split("T")[0];

/* colour palette per donation-purpose index */
const CARD_ACCENTS = [
    "#E07B54", "#F7C59F", "#EFEFD0", "#004E89",
    "#1A936F", "#C6AC8F", "#E84855", "#3A86FF",
    "#8338EC", "#FB5607",
];

/* ─── sub-components ─────────────────────────────────────────── */

function StatBadge({ label, value, accent = "#E07B54", icon }) {
    return (
        <Box sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            py: 1.2, px: 1.5, borderRadius: 2,
            background: `${accent}12`,
            border: `1px solid ${accent}30`,
        }}>
            <Avatar sx={{ bgcolor: accent, width: 36, height: 36 }}>
                {icon}
            </Avatar>
            <Box>
                <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: accent, lineHeight: 1.3 }}>
                    ₹ {fmt(value)}
                </Typography>
            </Box>
        </Box>
    );
}

function DonationCard({ item, accent, receiptsLabel, clickLabel, onClick }) {
    return (
        <Box onClick={onClick} sx={{
            borderRadius: 3, cursor: "pointer", overflow: "hidden",
            border: `1px solid ${accent}40`,
            background: `linear-gradient(135deg, #fff 60%, ${accent}10 100%)`,
            transition: "all 0.18s ease",
            "&:hover": { boxShadow: `0 8px 28px ${accent}30`, transform: "translateY(-2px)", border: `1px solid ${accent}80` },
        }}>
            {/* accent strip */}
            <Box sx={{ height: 4, background: accent }} />
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5, color: "#1a1a2e" }}>{item.purpose}</Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1 }}>
                    {receiptsLabel}: {item.receiptCount ?? 0}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: accent }}>
                    ₹ {fmt(item.amount)}
                </Typography>
                <Typography sx={{ fontSize: 10, color: `${accent}90`, mt: 0.5 }}>{clickLabel} →</Typography>
            </Box>
        </Box>
    );
}

function RentalCard({ title, data, t, accent }) {
    return (
        <Box sx={{
            borderRadius: 3, border: `1px solid ${accent}30`,
            background: `linear-gradient(135deg, #fff 60%, ${accent}08 100%)`,
            overflow: "hidden",
        }}>
            <Box sx={{ height: 4, background: accent }} />
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.5, color: "#1a1a2e" }}>{title}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                    {[
                        { label: t.transactions, value: data?.transactions ?? 0, prefix: "" },
                        { label: t.rent, value: fmt(data?.rentTotal), prefix: "₹" },
                        { label: t.deposit, value: fmt(data?.depositTotal), prefix: "₹" },
                    ].map(({ label, value, prefix }) => (
                        <Box key={label} sx={{ textAlign: "center", py: 1, px: 0.5, borderRadius: 1.5, background: `${accent}0a` }}>
                            <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.3 }}>{label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: accent }}>{prefix}{value}</Typography>
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
<div class="section-title">संक्षिप्त विवरण</div>
<table class="total-box">
  <tr><td><strong>कुल कलेक्शन राशि</strong></td><td>&#8377; ${fmt2(printData?.collectionTotal)}</td></tr>
  <tr><td><strong>कुल जमा राशि (डिपॉजिट)</strong></td><td>&#8377; ${fmt2(printData?.depositTotal)}</td></tr>
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
            const res = await getDashboardSummary(period, user, auth.username, auth.role);
            setData(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchDataForDate = async (dateStr) => {
        try {
            const u = isAdmin ? selectedUser : auth.username;
            const res = await getDashboardSummary("DAILY", u, auth.username, auth.role, dateStr);
            return res.data;
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

    return (
        <Box sx={{
            display: "flex", gap: 0, minHeight: "100vh",
            background: "#f5f6fa", fontFamily: "'Segoe UI', sans-serif",
        }}>

            {/* ══════════════════════════════════════
                LEFT SIDEBAR — Filters & Actions
            ══════════════════════════════════════ */}
            <Box sx={{
                width: 240, flexShrink: 0,
                background: "#1a1a2e",
                borderRight: "none",
                display: "flex", flexDirection: "column",
                p: 0, position: "sticky", top: 0, alignSelf: "flex-start",
                minHeight: "100vh",
            }}>
                {/* Header accent */}
                <Box sx={{ background: "linear-gradient(135deg, #E07B54 0%, #C96A42 100%)", p: 2.5, pb: 2 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>
                        {t.filters}
                    </Typography>
                    <Typography sx={{ color: "#fff9", fontSize: 11, mt: 0.3 }}>
                        {t.title}
                    </Typography>
                </Box>

                <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5, flex: 1 }}>

                    {/* Period toggle */}
                    <Box>
                        <Typography sx={{ color: "#aaa", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                            {t.period}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {[
                                { val: "DAILY", label: t.daily },
                                { val: "WEEKLY", label: t.weekly },
                                { val: "MONTHLY", label: t.monthly },
                            ].map(({ val, label }) => (
                                <Box
                                    key={val}
                                    onClick={() => setPeriod(val)}
                                    sx={{
                                        px: 1.5, py: 0.9, borderRadius: 1.5, cursor: "pointer",
                                        fontSize: 13, fontWeight: period === val ? 700 : 400,
                                        color: period === val ? "#fff" : "#888",
                                        background: period === val ? "linear-gradient(90deg,#E07B54,#C96A42)" : "transparent",
                                        border: period === val ? "none" : "1px solid #333",
                                        transition: "all 0.15s",
                                        "&:hover": { background: period === val ? undefined : "#2a2a3e", color: "#ccc" },
                                    }}
                                >
                                    {label}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: "#333" }} />

                    {/* User selector (admin only) */}
                    {isAdmin && (
                        <Box>
                            <Typography sx={{ color: "#aaa", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                                {t.user}
                            </Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={selectedUser}
                                    onChange={(e) => { setSelectedUser(e.target.value); fetchData(e.target.value); }}
                                    sx={{
                                        bgcolor: "#2a2a3e", color: "#e0e0e0", fontSize: 12, borderRadius: 1.5,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" },
                                        "& .MuiSvgIcon-root": { color: "#888" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#E07B54" },
                                    }}
                                >
                                    <MenuItem value="ALL">{t.allUsers}</MenuItem>
                                    {users.map((u) => <MenuItem key={u.id} value={u.username}>{u.username}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    <Divider sx={{ borderColor: "#333" }} />

                    {/* Report date */}
                    <Box>
                        <Typography sx={{ color: "#aaa", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, mb: 1 }}>
                            {t.reportDate}
                        </Typography>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={printDate}
                            onChange={(e) => setPrintDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: today() }}
                            sx={{
                                "& .MuiInputBase-root": {
                                    bgcolor: "#2a2a3e", color: "#e0e0e0", fontSize: 12, borderRadius: 1.5,
                                },
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" },
                                "& input::-webkit-calendar-picker-indicator": { filter: "invert(0.7)" },
                            }}
                        />
                    </Box>

                    <Divider sx={{ borderColor: "#333" }} />

                    {/* Action buttons */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Button
                            fullWidth variant="outlined" size="small" startIcon={<SearchIcon sx={{ fontSize: 15 }} />}
                            onClick={() => navigate("/donation/search")}
                            sx={{
                                borderColor: "#444", color: "#aaa", fontSize: 12, borderRadius: 1.5,
                                "&:hover": { borderColor: "#E07B54", color: "#E07B54", background: "#E07B5410" },
                            }}
                        >
                            {t.searchReceipt}
                        </Button>

                        <Button
                            fullWidth variant="contained" size="small" startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
                            onClick={handlePrintReport}
                            sx={{
                                background: "linear-gradient(90deg, #E07B54, #C96A42)", fontSize: 12,
                                borderRadius: 1.5, boxShadow: "0 4px 14px #E07B5440",
                                "&:hover": { background: "linear-gradient(90deg, #C96A42, #B05A35)" },
                            }}
                        >
                            {t.printDaily}
                        </Button>

                        <Button
                            fullWidth variant="outlined" size="small" startIcon={<LocalFloristIcon sx={{ fontSize: 15 }} />}
                            onClick={handlePrintGoshala}
                            sx={{
                                borderColor: "#4caf50", color: "#4caf50", fontSize: 12, borderRadius: 1.5,
                                "&:hover": { borderColor: "#66bb6a", color: "#66bb6a", background: "#4caf5015" },
                            }}
                        >
                            {t.printGoshala}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ══════════════════════════════════════
                MAIN CONTENT
            ══════════════════════════════════════ */}
            <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>

                {/* ── Top summary bar ── */}
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 2, mb: 3,
                }}>
                    <StatBadge label={t.totalCollection} value={donationTotal} accent="#E07B54" icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} />
                    <StatBadge label={t.totalDeposit} value={depositTotal} accent="#3A86FF" icon={<CurrencyRupeeIcon sx={{ fontSize: 18 }} />} />
                    <StatBadge label={t.goshalaDaan} value={goshalaAmt} accent="#4caf50" icon={<LocalFloristIcon sx={{ fontSize: 18 }} />} />
                </Box>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: "#E07B54" }} /></Box>
                ) : (
                    <>
                        {/* ── Donation cards ── */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <VolunteerActivismIcon sx={{ color: "#E07B54", fontSize: 18 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                                    {t.donationCollection}
                                </Typography>
                                <Chip
                                    label={`${data?.donations?.length ?? 0} categories`}
                                    size="small"
                                    sx={{ bgcolor: "#E07B5420", color: "#E07B54", fontSize: 10, height: 20, ml: 0.5 }}
                                />
                            </Box>
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                gap: 1.5,
                            }}>
                                {data?.donations?.map((item, i) => (
                                    <DonationCard
                                        key={item.purpose}
                                        item={item}
                                        accent={CARD_ACCENTS[i % CARD_ACCENTS.length]}
                                        receiptsLabel={t.receipts}
                                        clickLabel={t.clickForDetails}
                                        onClick={() => handleCardClick(item.purpose)}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* ── Rental cards ── */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <InventoryIcon sx={{ color: "#3A86FF", fontSize: 18 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                                    {t.rentalCollection}
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: 1.5,
                            }}>
                                <RentalCard title={t.rentalBartan} data={data?.rentalBartan} t={t} accent="#3A86FF" />
                                <RentalCard title={t.rentalBichayat} data={data?.rentalBichayat} t={t} accent="#8338EC" />
                            </Box>
                        </Box>

                        {/* ── Goshala ── */}
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <LocalFloristIcon sx={{ color: "#4caf50", fontSize: 18 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                                    {t.goshalaDaan}
                                </Typography>
                            </Box>
                            <Box sx={{ maxWidth: 260 }}>
                                <DonationCard
                                    item={{
                                        purpose: data?.goshalaDaan?.purpose || t.goshalaDaan,
                                        receiptCount: data?.goshalaDaan?.receiptCount ?? 0,
                                        amount: data?.goshalaDaan?.amount ?? 0,
                                    }}
                                    accent="#4caf50"
                                    receiptsLabel={t.receipts}
                                    clickLabel={t.printGoshala}
                                    onClick={handlePrintGoshala}
                                />
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
