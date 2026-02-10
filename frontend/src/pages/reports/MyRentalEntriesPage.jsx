import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Typography } from "@mui/material";
import { getMyRentalEntries } from "../../api/rentalReportApi";
import { useAuth } from "../../context/AuthContext";
import ReportFilters from "../../components/reports/ReportFilters";
import { useNavigate } from "react-router-dom";


export default function MyRentalEntriesPage() {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    category: ""
  });
  const navigate = useNavigate();


  useEffect(() => {
    getMyRentalEntries({
      createdBy: auth.username,
      ...filters
    }).then((r) =>
      setRows(
        r.data.map((x, i) => ({
          id: i,
          ...x
        }))
      )
    );
  }, [filters]);

  const columns = [
    { field: "receiptNumber", headerName: "रसीद", flex: 1 },
    { field: "createdAt", headerName: "दिनांक", flex: 1 },
    { field: "category", headerName: "श्रेणी", flex: 1 },
    { field: "customerName", headerName: "ग्राहक", flex: 1 },
    { field: "totalIssuedQty", headerName: "कुल सामान", flex: 1 },
    { field: "totalPendingQty", headerName: "बाकी", flex: 1 },
    { field: "chargedAmount", headerName: "आय", flex: 1 },
    { field: "discountAmount", headerName: "छूट", flex: 1 },
    { field: "status", headerName: "स्थिति", flex: 1 }
  ];

  return (
    <>
      <Typography variant="h5" gutterBottom>
        मेरी सभी किराया प्रविष्टियाँ
      </Typography>

      <ReportFilters filters={filters} onChange={setFilters} />

      <div style={{ height: 560 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 20, 50,100]}
          onRowClick={(params) =>
                navigate(`/rentals/view/${params.row.receiptNumber}`)
            }
            initialState={{
                pagination: {
                paginationModel: { pageSize: 20, page: 0 }
                }
            }}
        />
      </div>
    </>
  );
}
