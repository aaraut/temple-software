import React, { useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Box
} from "@mui/material";

const InventoryTable = ({ items = [], loading, onEdit, category  }) => {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.materialNameHi
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  return (
    <Paper
      sx={{
        p: 2,
        border: "1px solid #ddd",
        borderRadius: 1,
      }}
    >
      {/* Header + Search */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
           {category === "BICHAYAT"
            ? "Bichayat Material List"
             : "Bartan Material List"}{" "}
           ({filteredItems.length})
         </Typography>

        <TextField
          label="Search material"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Table */}
      <Table size="small"
        sx={{
          border: "1px solid #ccc",
          "& th, & td": {
            border: "1px solid #ddd",
          },
        }}
      >
        {/* Table Header */}
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: "#000",
            }}
          >
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
              नाम
            </TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
              Unit
            </TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
              Rate
            </TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
              Stock
            </TableCell>
            <TableCell
              sx={{ color: "#fff", fontWeight: 600 }}
              align="center"
            >
              Action
            </TableCell>
          </TableRow>
        </TableHead>

        {/* Table Body */}
        <TableBody>
          {!loading &&
            filteredItems.map((item, index) => (
              <TableRow
                key={item.id}
                sx={{
                  backgroundColor:
                    index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                  "&:hover": {
                    backgroundColor: "#f1f1f1",
                  },
                }}
              >
                <TableCell>{item.materialNameHi}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.rate}</TableCell>
                <TableCell>{item.totalStock}</TableCell>
                <TableCell align="center">
                  <Button size="small" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default InventoryTable;
