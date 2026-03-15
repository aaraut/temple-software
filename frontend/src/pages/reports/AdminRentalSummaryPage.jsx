import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Typography } from "@mui/material";
import { getAdminRentalSummary } from "../../api/rentalReportApi";
import ReportFilters from "../../components/reports/ReportFilters";

export default function AdminRentalSummaryPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: ""
  });

  useEffect(() => {
    getAdminRentalSummary(filters).then((r) =>
      setRows(
        r.data.userBreakdown.map((x, i) => ({
          id: i,
          ...x,
          discountPercent:
            x.calculatedAmount > 0
              ? ((x.discountAmount / x.calculatedAmount) * 100).toFixed(1)
              : 0
        }))
      )
    );
  }, [filters]);

  const columns = [
    { field: "createdBy", headerName: "यूज़र", flex: 1 },
    { field: "totalRentals", headerName: "किराये", flex: 1 },
    { field: "chargedAmount", headerName: "आय", flex: 1 },
    { field: "discountAmount", headerName: "छूट", flex: 1 },
    { field: "discountPercent", headerName: "छूट %", flex: 1 }
  ];

  return (
    <>
      <Typography variant="h5" gutterBottom>
        किराया आय (एडमिन)
      </Typography>

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        showCategory={false}
      />

      <div style={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 20]}
        />
      </div>
    </>
  );
}
