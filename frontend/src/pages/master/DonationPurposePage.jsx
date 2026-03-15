import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Chip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import {
  listDonationPurposes,
  createDonationPurpose,
  updateDonationPurpose
} from "../../api/donationPurposeApi";
import { useAuth } from "../../context/AuthContext";

import DonationPurposeForm from "../../components/DonationPurposeForm";

export default function DonationPurposePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const { auth } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await listDonationPurposes();
      setRows(res || []);
    } catch (err) {
      setSnackbar({
        type: "error",
        message: "डेटा लोड करने में त्रुटि हुई"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setOpen(true);
  };

  const handleSubmit = async (formData) => {
  try {
    if (editData) {
      await updateDonationPurpose(
        editData.id,
        formData,
        auth.username
      );
      setSnackbar({ type: "success", message: "सफलतापूर्वक अपडेट किया गया" });
    } else {
      await createDonationPurpose(
        formData,
        auth.username
      );
      setSnackbar({ type: "success", message: "सफलतापूर्वक जोड़ा गया" });
    }
    setOpen(false);
    fetchData();
  } catch (err) {
    setSnackbar({
      type: "error",
      message: "सहेजने में त्रुटि हुई"
    });
  }
};

  const columns = [
    {
      field: "nameHi",
      headerName: "उद्देश्य (हिंदी)",
      flex: 1.2
    },
    {
      field: "nameEn",
      headerName: "Purpose (English)",
      flex: 1.2
    },
    {
        field: "receiptPrefix",
        headerName: "Prefix",
        flex: 0.7
    },
    {
      field: "fixedAmount",
      headerName: "निश्चित राशि",
      flex: 1,
      renderCell: (params) =>
        params.value ? `₹ ${params.value}` : "-"
    },
    {
      field: "active",
      headerName: "स्थिति",
      flex: 0.8,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Active" color="success" size="small" />
        ) : (
          <Chip label="Inactive" color="error" size="small" />
        )
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 0.8,
      renderCell: (params) => (
        <Button
          startIcon={<EditIcon />}
          size="small"
          variant="outlined"
          onClick={() => handleEdit(params.row)}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Donation Purpose Management
      </Typography>

      <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            नया उद्देश्य जोड़ें
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          autoHeight
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } }
          }}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editData ? "उद्देश्य अपडेट करें" : "नया उद्देश्य जोड़ें"}
        </DialogTitle>
        <DialogContent>
          <DonationPurposeForm
            initialData={editData}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
      >
        <Alert severity={snackbar?.type}>{snackbar?.message}</Alert>
      </Snackbar>
    </Box>
  );
}