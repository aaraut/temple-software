import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Typography } from "@mui/material";
import { getPendingRentals } from "../../api/rentalReportApi";
import ReportFilters from "../../components/reports/ReportFilters";

export default function PendingRentalReportPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    category: ""
  });

  const loadData = () => {
    getPendingRentals(filters).then((r) =>
      setRows(r.data.map((x, i) => ({ id: i, ...x })))
    );
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const columns = [
    { field: "receiptNumber", headerName: "रसीद", flex: 1 },
    { field: "customerName", headerName: "नाम", flex: 1 },
    { field: "createdBy", headerName: "यूज़र", flex: 1 },
    { field: "totalPendingQty", headerName: "बाकी सामान", flex: 1 },
    { field: "depositAmount", headerName: "जमा", flex: 1 },
    { field: "status", headerName: "स्थिति", flex: 1 }
  ];

  return (
    <>
      <Typography variant="h5" gutterBottom>
        लंबित किराये
      </Typography>

      <ReportFilters filters={filters} onChange={setFilters} />

      <div style={{ height: 520 }}>
        <DataGrid 
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
    </>
  );
}
