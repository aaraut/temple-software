import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Divider
} from "@mui/material";
import { getRentalByReceipt } from "../../api/rentalApi";
import { Button, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate } from "react-router-dom";


export default function RentalDetailPage() {
    const { receiptNumber } = useParams();
    const [rental, setRental] = useState(null);

    useEffect(() => {
        getRentalByReceipt(receiptNumber).then((r) =>
            setRental(r.data)
        );
    }, [receiptNumber]);

    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };


    if (!rental) return null;

    return (
        <>
            <Stack
                direction="row"
                spacing={2}
                sx={{ mb: 2, justifyContent: "space-between" }}
            >
                <Button
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    onClick={() => navigate(-1)}
                >
                    वापस जाएँ
                </Button>

                <Button
                    startIcon={<PrintIcon />}
                    variant="contained"
                    color="primary"
                    onClick={handlePrint}
                >
                    रसीद प्रिंट करें
                </Button>
            </Stack>
            <div className="print-area">
                <Typography variant="h5" gutterBottom>
                    किराया विवरण
                </Typography>

                {/* -------- Header Info -------- */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <b>रसीद:</b> {rental.receiptNumber}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <b>ग्राहक:</b> {rental.customerName}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <b>मोबाइल:</b> {rental.mobile}
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <b>श्रेणी:</b>{" "}
                                {rental.category === "BARTAN" ? "बर्तन" : "बिछायत"}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <b>जमा:</b> ₹{rental.depositAmount}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <b>स्थिति:</b> {rental.status}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* -------- Item Table -------- */}
                <Typography variant="h6" gutterBottom>
                    किराया सामान
                </Typography>

                <Table>
                    <TableHead sx={{ backgroundColor: "#7a1f1f" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white" }}>सामान</TableCell>
                            <TableCell sx={{ color: "white" }}>जारी</TableCell>
                            <TableCell sx={{ color: "white" }}>वापस</TableCell>
                            <TableCell sx={{ color: "white" }}>टूटा</TableCell>
                            <TableCell sx={{ color: "white" }}>गायब</TableCell>
                            <TableCell sx={{ color: "white" }}>बाकी</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rental.items.map((item) => (
                            <TableRow key={item.rentalItemId}>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell>{item.issuedQty}</TableCell>
                                <TableCell>{item.returnedQty}</TableCell>
                                <TableCell>{item.damagedQty}</TableCell>
                                <TableCell>{item.missingQty}</TableCell>
                                <TableCell>{item.remainingQty}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* -------- Money Summary -------- */}
                <Typography variant="h6">राशि विवरण</Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <b>कुल मूल्य:</b> ₹{rental.calculatedTotalAmount}
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <b>वसूल राशि:</b> ₹{rental.chargedAmount}
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <b>जुर्माना:</b> ₹{rental.totalFineAmount}
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <b>वापसी योग्य जमा:</b>{" "}
                        ₹{rental.depositAmount - rental.totalFineAmount}
                    </Grid>
                </Grid>
            </div>
        </>
    );
}
