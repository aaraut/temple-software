import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    Card,
    CardContent,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../api/dashboardApi";
import { listUsers } from "../../api/userApi";
import { useNavigate } from "react-router-dom";

export default function CollectionDashboard() {
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [period, setPeriod] = useState("DAILY");
    const [selectedUser, setSelectedUser] = useState("ALL");
    const [data, setData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const isAdmin = auth?.role === "ADMIN";

    // Load users if admin
    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);

    // Fetch dashboard data
    useEffect(() => {
        fetchData();
    }, [period]);

    const loadUsers = async () => {
        try {
            const userList = await listUsers();
            const activeUsers = userList.filter((u) => u.active);
            setUsers(activeUsers);
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getDashboardSummary(
                period,
                selectedUser,
                auth.username,
                auth.role
            );
            setData(res.data);
        } catch (err) {
            console.error("Dashboard error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (_, value) => {
        if (value) setPeriod(value);
    };

    const handleCardClick = (purpose) => {
        navigate(
            `/reports/details?purpose=${purpose}&period=${period}&user=${selectedUser}`
        );
    };

    const fetchDataWithUser = async (userValue) => {
        try {
            setLoading(true);
            const res = await getDashboardSummary(
                period,
                userValue,
                auth.username,
                auth.role
            );
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    const handlePrintReport = () => {
        const reportDate = new Date().toLocaleDateString("en-GB");

        const userLabel =
            selectedUser === "ALL"
                ? "All Users"
                : selectedUser || auth.username;

        const printWindow = window.open("", "_blank");

        const donationRows =
            data?.donations?.map(
                (d) => `
        <tr>
          <td>${d.purpose}</td>
          <td>${d.receiptCount || 0}</td>
          <td>₹ ${formatAmount(d.amount)}</td>
        </tr>
      `
            ).join("") || "";

        printWindow.document.write(`
    <html>
      <head>
        <title>Daily Cash Report</title>
        <style>
          body {
            font-family: Arial;
            padding: 20px;
            font-size: 14px;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
          }

          .header h2 {
            margin: 5px 0;
          }

          .sub {
            font-size: 13px;
          }

          .section-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 5px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }

          table, th, td {
            border: 1px solid black;
          }

          th, td {
            padding: 6px;
            text-align: left;
          }

          .total-box {
            width: 50%;
            margin-top: 15px;
          }

          .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }

          .sign-box {
            width: 40%;
            border-top: 1px solid black;
            text-align: center;
            padding-top: 8px;
          }

          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>

        <div class="header">
          <h2>चमत्कारिक श्री हनुमान मंदिर ट्रस्ट समिति</h2>
          <div class="sub">
            जामसावली, ता. सौसर, जि. छिंदवाड़ा (म. प्र.)
          </div>
          <div class="sub">
            Reg. No: 48/90 | URN: AABTC40DICF2023 | Email: jamsawlimandir@gmail.com
          </div>
          <h3>दैनिक नगद विवरण</h3>
          <div>Date: ${reportDate}</div>
          <div>User: ${userLabel}</div>
        </div>

        <div class="section-title">दान संग्रह</div>

        <table>
          <thead>
            <tr>
              <th>उद्देश्य</th>
              <th>रसीद संख्या</th>
              <th>राशि</th>
            </tr>
          </thead>
          <tbody>
            ${donationRows}
          </tbody>
        </table>

        <div class="section-title">किराया संग्रह</div>

        <table>
          <tr>
            <td><strong>बर्तन किराया</strong></td>
            <td>Transactions: ${data?.rentalBartan?.transactions || 0}</td>
            <td>₹ ${formatAmount(data?.rentalBartan?.rentTotal)}</td>
          </tr>
          <tr>
            <td><strong>बिछायत किराया</strong></td>
            <td>Transactions: ${data?.rentalBichayat?.transactions || 0}</td>
            <td>₹ ${formatAmount(data?.rentalBichayat?.rentTotal)}</td>
          </tr>
        </table>

        <div class="section-title">सारांश</div>

        <table class="total-box">
          <tr>
            <td><strong>कुल संग्रह राशि</strong></td>
            <td>₹ ${formatAmount(data?.collectionTotal)}</td>
          </tr>
          <tr>
            <td><strong>कुल जमा राशि (डिपॉजिट)</strong></td>
            <td>₹ ${formatAmount(data?.depositTotal)}</td>
          </tr>
        </table>

        <div class="signature">
          <div class="sign-box">जमाकर्ता के हस्ताक्षर</div>
          <div class="sign-box">प्राप्तकर्ता के हस्ताक्षर</div>
        </div>

        <script>
          window.print();
        </script>

      </body>
    </html>
  `);

        printWindow.document.close();
    };

    const handlePrintGoshala = () => {
        const reportDate = new Date().toLocaleDateString("en-GB");

        const userLabel =
            selectedUser === "ALL"
                ? "All Users"
                : selectedUser || auth.username;

        const printWindow = window.open("", "_blank");

        printWindow.document.write(`
    <html>
      <head>
        <title>Goshala Daan Report</title>
        <style>
          body {
            font-family: Arial;
            padding: 30px;
            font-size: 14px;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }

          .header h2 {
            margin: 3px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          table, th, td {
            border: 1px solid black;
          }

          th, td {
            padding: 8px;
            text-align: left;
          }

          .summary-table {
            width: 50%;
            margin-top: 20px;
          }

          .signature {
            margin-top: 70px;
            display: flex;
            justify-content: space-between;
          }

          .sign-box {
            width: 40%;
            border-top: 1px dotted black;
            text-align: center;
            padding-top: 8px;
          }

          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>

        <div class="header">
          <h2>श्री बजरंग गोशाला</h2>
          <h2>चमत्कारिक श्री हनुमान मंदिर संस्थान (हनुमान लोक)</h2>
          <div>
            सौसर, तह. सौसर जि. पांढुर्णा (म. प्र.)
          </div>
          <div>
            रजि.नं.: 658 / 04 | ईमेल: jamsawlimandir@gmail.com
          </div>
          <h3 style="margin-top:15px;">दैनिक नगद विवरण</h3>
          <div>दिनांक: ${reportDate}</div>
          <div>उपयोगकर्ता: ${userLabel}</div>
        </div>

        <table>
          <tr>
            <th>गौशाला दान खाते</th>
            <th>राशि</th>
          </tr>
          <tr>
            <td>गौशाला दान खाते</td>
            <td>₹ ${formatAmount(data?.goshalaDaan?.amount)}</td>
          </tr>
          <tr>
            <td><strong>कुल राशि</strong></td>
            <td><strong>₹ ${formatAmount(data?.goshalaDaan?.amount)}</strong></td>
          </tr>
        </table>

        <div class="signature">
          <div class="sign-box">जमाकर्ता के हस्ताक्षर</div>
          <div class="sign-box">प्राप्तकर्ता के हस्ताक्षर</div>
        </div>

        <script>
          window.print();
        </script>

      </body>
    </html>
  `);

        printWindow.document.close();
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Box sx={{ width: "1100px" }}>
                <Typography variant="h5" fontWeight={600} mb={2}>
                    Collection Summary
                </Typography>

                {/* Controls */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 3
                    }}
                >
                    <ToggleButtonGroup
                        value={period}
                        exclusive
                        onChange={handleToggle}
                        size="small"
                    >
                        <ToggleButton value="DAILY">Daily</ToggleButton>
                        <ToggleButton value="WEEKLY">Weekly</ToggleButton>
                        <ToggleButton value="MONTHLY">Monthly</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ display: "flex", gap: 2 }}>
                        {isAdmin && (
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>User</InputLabel>
                                <Select
                                    value={selectedUser}
                                    label="User"
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        setSelectedUser(value);
                                        await fetchDataWithUser(value);
                                    }}
                                >
                                    <MenuItem value="ALL">All Users</MenuItem>
                                    {users.map((u) => (
                                        <MenuItem key={u.id} value={u.username}>
                                            {u.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* 🔍 SEARCH RECEIPT BUTTON */}
                        <Button
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={() => navigate("/donation/search")}
                        >
                            Search Receipt
                        </Button>

                        {/* 🖨 PRINT REPORT BUTTON */}
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={handlePrintReport}
                        >
                            Print Daily Report
                        </Button>

                    </Box>
                </Box>

                {loading ? (
                    <Box textAlign="center" mt={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* ================= DONATION SECTION ================= */}
                        <Box mb={4}>
                            <Typography fontWeight={600} mb={2}>
                                Donation Collection
                            </Typography>

                            <Grid container spacing={2}>
                                {data?.donations?.map((item) => (
                                    <Grid item xs={12} sm={6} md={4} key={item.purpose}>
                                        <Card
                                            onClick={() => handleCardClick(item.purpose)}
                                            sx={{
                                                borderRadius: 3,
                                                cursor: "pointer",
                                                transition: "0.2s",
                                                "&:hover": { boxShadow: 6 }
                                            }}
                                        >
                                            <CardContent>
                                                <Typography fontWeight={600}>
                                                    {item.purpose}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    Receipts: {item.receiptCount ?? 0}
                                                </Typography>

                                                <Typography variant="h6" mt={1}>
                                                    ₹ {formatAmount(item.amount)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* ================= RENTAL SECTION ================= */}
                        <Box>
                            <Typography fontWeight={600} mb={2}>
                                Rental Collection
                            </Typography>

                            <Grid container spacing={2}>
                                {/* Rental Bartan */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ borderRadius: 3 }}>
                                        <CardContent>
                                            <Typography fontWeight={600}>
                                                Rental Bartan
                                            </Typography>

                                            <Typography variant="body2">
                                                Transactions: {data?.rentalBartan?.transactions ?? 0}
                                            </Typography>

                                            <Typography variant="body2">
                                                Rent: ₹ {formatAmount(data?.rentalBartan?.rentTotal)}
                                            </Typography>

                                            <Typography variant="body2">
                                                Deposit: ₹ {formatAmount(data?.rentalBartan?.depositTotal)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Rental Bichayat */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ borderRadius: 3 }}>
                                        <CardContent>
                                            <Typography fontWeight={600}>
                                                Rental Bichayat
                                            </Typography>

                                            <Typography variant="body2">
                                                Transactions: {data?.rentalBichayat?.transactions ?? 0}
                                            </Typography>

                                            <Typography variant="body2">
                                                Rent: ₹ {formatAmount(data?.rentalBichayat?.rentTotal)}
                                            </Typography>

                                            <Typography variant="body2">
                                                Deposit: ₹ {formatAmount(data?.rentalBichayat?.depositTotal)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Totals */}
                        <Box mt={4}>
                            <Typography fontWeight={600}>
                                Total Collection: ₹{" "}
                                {formatAmount(data?.collectionTotal)}
                            </Typography>
                            <Typography>
                                Total Deposits Held: ₹{" "}
                                {formatAmount(data?.depositTotal)}
                            </Typography>
                        </Box>

                        {/* ================= GOSHALA SECTION ================= */}
                        {/* ================= GOSHALA SECTION ================= */}
                        <Box mt={6}>
                            <Typography fontWeight={600} mb={2}>
                                Goshala Daan
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    flexWrap: "wrap" // keeps responsive on small screens
                                }}
                            >
                                {/* Card */}
                                <Box sx={{ width: { xs: "100%", sm: "50%", md: "33%" } }}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            border: "1px solid #4caf50",
                                            "&:hover": { boxShadow: 6 }
                                        }}
                                    >
                                        <CardContent>
                                            <Typography fontWeight={600}>
                                                {data?.goshalaDaan?.purpose || "Goshala Daan"}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                Receipts: {data?.goshalaDaan?.receiptCount ?? 0}
                                            </Typography>

                                            <Typography variant="h6" mt={1}>
                                                ₹ {formatAmount(data?.goshalaDaan?.amount)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Box>

                                {/* Button */}
                                <Button
                                    variant="outlined"
                                    startIcon={<PrintIcon />}
                                    onClick={handlePrintGoshala}
                                    sx={{ height: "fit-content" }}
                                >
                                    Print Goshala Report
                                </Button>
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}