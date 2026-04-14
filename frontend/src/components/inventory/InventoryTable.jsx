import React, { useMemo, useState } from "react";
import {
  Paper, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Button, Typography, Box
} from "@mui/material";

const L = {
  en: {
    bartan: "Bartan Material List",
    bichayat: "Bichayat Material List",
    search: "Search material",
    name: "Name",
    unit: "Unit",
    rate: "Rate",
    stock: "Stock",
    action: "Action",
    edit: "Edit",
  },
  hi: {
    bartan: "बर्तन सामग्री सूची",
    bichayat: "बिछायत सामग्री सूची",
    search: "सामग्री खोजें",
    name: "नाम",
    unit: "इकाई",
    rate: "दर",
    stock: "स्टॉक",
    action: "कार्य",
    edit: "एडिट",
  },
};

const InventoryTable = ({ items = [], loading, onEdit, category, language = "hi" }) => {
  const [search, setSearch] = useState("");
  const t = L[language] ?? L.en;

  const filteredItems = useMemo(() =>
    items.filter((item) =>
      item.materialNameHi?.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const listTitle = category === "BICHAYAT" ? t.bichayat : t.bartan;

  return (
    <Paper sx={{ p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">{listTitle} ({filteredItems.length})</Typography>
        <TextField
          label={t.search}
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Table size="small" sx={{ border: "1px solid #ccc", "& th, & td": { border: "1px solid #ddd" } }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#000" }}>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.name}</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.unit}</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.rate}</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{t.stock}</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }} align="center">{t.action}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && filteredItems.map((item, index) => (
            <TableRow
              key={item.id}
              sx={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff", "&:hover": { backgroundColor: "#f1f1f1" } }}
            >
              <TableCell>{item.materialNameHi}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.rate}</TableCell>
              <TableCell>{item.totalStock}</TableCell>
              <TableCell align="center">
                <Button size="small" onClick={() => onEdit(item)}>{t.edit}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default InventoryTable;
