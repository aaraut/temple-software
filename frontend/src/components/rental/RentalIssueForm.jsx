import { useState, useMemo, useEffect } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  Box,
  Grid,
  Typography,
  CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { searchDonorByMobile } from "../../api/rentalApi";

const labels = {
  hi: {
    titleBartan: "बर्तन किराया",
    titleBichayat: "बिछायत किराया",
    name: "नाम",
    mobile: "मोबाइल नंबर",
    address: "पता",
    addItem: "सामान जोड़ें",
    submit: "किराया दर्ज करें",
    qty: "मात्रा",
    rate: "दर",
    total: "योग",
    autoFilled: "✔ पिछले दान रिकॉर्ड से भरा गया",
    calculatedTotal: "गणना की गई कुल राशि",
    chargedAmount: "देय राशि",
    depositAmount: "जमानत राशि",
    saveAndPrint: "सेव और प्रिंट करें",
    reset: "रद्द करें"
  },
  en: {
    titleBartan: "Bartan Rental",
    titleBichayat: "Bichayat Rental",
    name: "Name",
    mobile: "Mobile",
    address: "Address",
    addItem: "Add Item",
    submit: "Create Rental",
    qty: "Quantity",
    rate: "Rate",
    total: "Total",
    autoFilled: "✔ Auto-filled from previous donation record",
    calculatedTotal: "Calculated Total",
    chargedAmount: "Charged Amount",
    depositAmount: "Deposit Amount",
    saveAndPrint: "Save & Print",
    reset: "Reset"
  }
};

export default function RentalIssueForm({
  inventory = [],
  language,
  category,
  onSubmit
}) {
  const t = labels[language];

  const [customer, setCustomer] = useState({
    customerName: "",
    mobile: "",
    address: "",
    aadhaar: "000"
  });

  const [items, setItems] = useState([
    { inventoryItemId: "", quantity: 1, rate: 0 }
  ]);

  const [depositAmount, setDepositAmount] = useState("");
  const [chargedAmount, setChargedAmount] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);
  const [searching, setSearching] = useState(false);

  const calculatedTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.rate * i.quantity, 0);
  }, [items]);

  useEffect(() => {
    setItems([{ inventoryItemId: "", quantity: 1, rate: 0 }]);
    setDepositAmount("");
    setChargedAmount("");
    setCustomer({ customerName: "", mobile: "", address: "", aadhaar: "000" });
    setAutoFilled(false);
  }, [category]);

  useEffect(() => {
    setChargedAmount(calculatedTotal);
  }, [calculatedTotal]);

  // ── Mobile blur → search donation table → prefill name + address ───────────
  const handleMobileBlur = async () => {
    if (!customer.mobile || customer.mobile.length < 5) return;
    try {
      setSearching(true);
      const results = await searchDonorByMobile(customer.mobile);
      if (results && results.length > 0) {
        const latest = results[0];
        setCustomer(prev => ({
          ...prev,
          customerName: latest.donorName || prev.customerName,
          address: latest.address || prev.address
        }));
        setAutoFilled(true);
      }
    } catch {
      // silent — user can still type manually
    } finally {
      setSearching(false);
    }
  };
  // ───────────────────────────────────────────────────────────────────────────

  const addItem = () => {
    setItems([...items, { inventoryItemId: "", quantity: 1, rate: 0 }]);
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    if (field === "inventoryItemId") {
      const inv = inventory.find(i => i.id === Number(value));
      updated[idx].rate = inv?.rate || 0;
    }
    setItems(updated);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    onSubmit({
      ...customer,
      items: items.map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantity: i.quantity
      })),
      calculatedTotalAmount: calculatedTotal,
      chargedAmount: chargedAmount || calculatedTotal,
      depositAmount
    });
  };

  const handleReset = () => {
    setItems([{ inventoryItemId: "", quantity: 1, rate: 0 }]);
    setDepositAmount("");
    setChargedAmount("");
    setCustomer({ customerName: "", mobile: "", address: "", aadhaar: "000" });
    setAutoFilled(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <h2 style={{ margin: 0 }}>
          {category === "BARTAN" ? t.titleBartan : t.titleBichayat}
        </h2>
      </Box>

      {/* Customer Details */}
      <Box sx={{ mb: 1 }}>
        <Grid container spacing={2}>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t.mobile}
              value={customer.mobile}
              onChange={(e) => {
                setAutoFilled(false);
                setCustomer({ ...customer, mobile: e.target.value });
              }}
              onBlur={handleMobileBlur}
              InputProps={{
                endAdornment: searching
                  ? <CircularProgress size={16} sx={{ mr: 1 }} />
                  : null
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t.name}
              value={customer.customerName}
              onChange={(e) =>
                setCustomer({ ...customer, customerName: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t.address}
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
            />
          </Grid>

        </Grid>

        {/* Autofill note — same style as donation form */}
        {autoFilled && (
          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>
            {t.autoFilled}
          </Typography>
        )}
      </Box>

      {/* Items Table */}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#7a1f1f" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: 600 }}>सामान</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.qty}</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.rate}</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.total}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={row.inventoryItemId}
                    onChange={(e) =>
                      updateItem(idx, "inventoryItemId", e.target.value)
                    }
                  >
                    <MenuItem value="">-- सामान चुनें --</MenuItem>
                    {inventory.map(inv => (
                      <MenuItem key={inv.id} value={inv.id}>
                        {inv.materialNameHi} (उपलब्ध: {inv.totalStock})
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                <TableCell sx={{ py: 1 }}>
                  <TextField
                    type="number"
                    size="small"
                    inputProps={{ min: 1 }}
                    value={row.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", Number(e.target.value))
                    }
                  />
                </TableCell>

                <TableCell sx={{ py: 1 }}>{row.rate}</TableCell>
                <TableCell sx={{ py: 1 }}>{row.rate * row.quantity}</TableCell>

                <TableCell sx={{ py: 1 }}>
                  <IconButton size="small" onClick={() => removeItem(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Button onClick={addItem} size="small" sx={{ mt: 1, mb: 2 }}>
        + {t.addItem}
      </Button>

      {/* Totals */}
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label={t.calculatedTotal}
              value={calculatedTotal}
              fullWidth
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label={t.chargedAmount}
              value={chargedAmount}
              size="small"
              fullWidth
              disabled
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label={t.depositAmount}
              value={depositAmount}
              size="small"
              fullWidth
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Submit */}
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {t.saveAndPrint}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleReset}
          style={{ marginLeft: 20 }}
        >{t.reset}</Button>
      </Box>
    </Paper>
  );
}
