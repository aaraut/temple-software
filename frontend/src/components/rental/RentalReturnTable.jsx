import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Paper
} from "@mui/material";

export default function RentalReturnTable({ rental, onChange }) {
  const update = (itemId, field, value) => {
    onChange(prev => ({
      ...prev,
      [itemId]: {
        rentalItemId: itemId,
        returnedQty: field === "returnedQty" ? value : prev[itemId]?.returnedQty || 0,
        damagedQty: field === "damagedQty" ? value : prev[itemId]?.damagedQty || 0,
        missingQty: field === "missingQty" ? value : prev[itemId]?.missingQty || 0
      }
    }));
  };

  return (
    <Paper sx={{ mt: 3 }}>
      <Table>
        <TableHead sx={{ background: "#7a1f1f" }}>
          <TableRow>
            <TableCell sx={{ color: "white" }}>सामान</TableCell>
            <TableCell sx={{ color: "white" }}>बाकी</TableCell>
            <TableCell sx={{ color: "white" }}>वापस</TableCell>
            <TableCell sx={{ color: "white" }}>टूटा</TableCell>
            <TableCell sx={{ color: "white" }}>गायब</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rental.items.map(item => (
            <TableRow key={item.rentalItemId}>
              <TableCell>{item.itemName}</TableCell>
              <TableCell>{item.remainingQty}</TableCell>

              <TableCell>
                <TextField
                  type="number"
                  onChange={(e) =>
                    update(item.rentalItemId, "returnedQty", Number(e.target.value))
                  }
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  onChange={(e) =>
                    update(item.rentalItemId, "damagedQty", Number(e.target.value))
                  }
                />
              </TableCell>

              <TableCell>
                <TextField
                  type="number"
                  onChange={(e) =>
                    update(item.rentalItemId, "missingQty", Number(e.target.value))
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
