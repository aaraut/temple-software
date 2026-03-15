import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";

export default function RentalDetails() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);

  const isAdmin = auth.role === "ADMIN";

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    const res = await axiosClient.get("/rental"); // adjust if needed
    setRows(res.data);
  };

  const columns = [
    { field: "receiptNumber", headerName: "Receipt", width: 150 },
    { field: "customerName", headerName: "Customer", width: 200 },
    {
      field: "chargedAmount",
      headerName: "Rent",
      width: 120
    },
    {
      field: "depositAmount",
      headerName: "Deposit",
      width: 120
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small">View</Button>

          {isAdmin && (
            <>
              <Button size="small">Update</Button>
              <Button size="small" color="error">
                Disable
              </Button>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        Rental Details
      </Typography>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
      />
    </Box>
  );
}