import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext";
import {
  searchDonations,
  printDonation,
  changeDonationStatus
} from "../../api/donationApi";
import { useNavigate } from "react-router-dom";

export default function DonationSearch() {
  const { auth, language } = useAuth();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);

  const isAdmin = auth.role === "ADMIN";

  const handleSearch = async () => {
    const res = await searchDonations({
      mobile,
      donorName: name
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

  const columns = [
    { field: "receiptNumber", headerName: "Receipt", width: 150 },
    { field: "donorName", headerName: "Name", width: 200 },
    { field: "mobile", headerName: "Mobile", width: 140 },
    { field: "purposeNameEn", headerName: "Purpose", width: 180 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      valueFormatter: (params) =>
        `₹ ${Number(params.value).toLocaleString("en-IN")}`
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleString()
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 300,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={() =>
              navigate(`/donation/edit/${params.row.id}?mode=view`)
            }
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
                onClick={() =>
                  navigate(`/donation/edit/${params.row.id}`)
                }
              >
                Update
              </Button>

              <Button
                size="small"
                color="error"
                onClick={() =>
                  changeDonationStatus(params.row.id, false)
                }
              >
                Disable
              </Button>
            </>
          )}
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>
        Search Past Donations
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <TextField
          label="Donor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Stack>

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