import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  searchDonations,
  printDonation,
  changeDonationStatus,
} from "../../api/donationApi";

export default function DonationDetails() {
  const { auth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const purpose = params.get("purpose");
  const period = params.get("period");
  const selectedUser = params.get("user");

  const [rows, setRows] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const isAdmin = auth?.role === "ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const getDateRange = () => {
    const now = new Date();

    if (period === "DAILY") {
      return { fromDate: now, toDate: now };
    }

    if (period === "WEEKLY") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      return { fromDate: start, toDate: now };
    }

    if (period === "MONTHLY") {
      const start = new Date();
      start.setMonth(now.getMonth() - 1);
      return { fromDate: start, toDate: now };
    }

    return { fromDate: now, toDate: now };
  };

  const loadData = async () => {
    const range = getDateRange();

    const res = await searchDonations({
      purposeNameEn: purpose,
      createdBy: selectedUser,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });

    setRows(res.data);
  };

  const handlePrint = async (row) => {
    const response = await printDonation(row.id);
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
    window.open(url);
  };

  const handleDisable = async (id) => {
    await changeDonationStatus(id, false);
    loadData();
  };

  const handleUpdate = (row) => {
    navigate(`/donation/edit/${row.id}`);
  };

  const columns = [
    { field: "receiptNumber", headerName: "Receipt", width: 150 },
    { field: "donorName", headerName: "Donor", width: 200 },
    { field: "mobile", headerName: "Mobile", width: 140 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      valueFormatter: (params) =>
        `₹ ${Number(params.value).toLocaleString("en-IN")}`,
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
      width: 300,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={() => navigate(`/donation/edit/${params.row.id}?mode=view`)}
            >
            View
        </Button>

          <Button
            size="small"
            onClick={() => handlePrint(params.row)}
          >
            Print
          </Button>

          {isAdmin && (
            <>
              <Button
                size="small"
                onClick={() => handleUpdate(params.row)}
              >
                Update
              </Button>

              <Button
                size="small"
                color="error"
                onClick={() => setConfirmId(params.row.id)}
              >
                Disable
              </Button>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        {purpose} - Receipt Details
      </Typography>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 20, 50]}
      />
    </Box>
    <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Confirm Disable</DialogTitle>
        <DialogContent>
            Are you sure you want to disable this donation?
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
            color="error"
            onClick={async () => {
                await changeDonationStatus(confirmId, false);
                setConfirmId(null);
                loadData();
            }}
            >
            Confirm
            </Button>
        </DialogActions>
    </Dialog>

    </>
  );
}

