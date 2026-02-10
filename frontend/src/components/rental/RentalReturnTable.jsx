import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Paper
} from "@mui/material";

const labels = {
  hi: {
    item: "सामान",
    remaining: "बाकी",
    returned: "वापस",
    damaged: "टूटा",
    missing: "गायब"
  },
  en: {
    item: "Item",
    remaining: "Remaining",
    returned: "Returned",
    damaged: "Damaged",
    missing: "Missing"
  }
};


export default function RentalReturnTable({ rental, onChange, language  }) {

    const t = labels[language];

  const update = (item, field, value) => {
    const safe = Math.max(0, value || 0);

    onChange(prev => ({
      ...prev,
      [item.rentalItemId]: {
        rentalItemId: item.rentalItemId,
        returnedQty: field === "returnedQty" ? safe : prev[item.rentalItemId]?.returnedQty || 0,
        damagedQty: field === "damagedQty" ? safe : prev[item.rentalItemId]?.damagedQty || 0,
        missingQty: field === "missingQty" ? safe : prev[item.rentalItemId]?.missingQty || 0
      }
    }));
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: "#7a1f1f" }}>
          <TableRow>
            <TableCell sx={{ color: "white" }}>{t.item}</TableCell>
            <TableCell sx={{ color: "white" }} align="center">बाकी</TableCell>
            <TableCell sx={{ color: "white" }} align="center">वापस</TableCell>
            <TableCell sx={{ color: "white" }} align="center">टूटा</TableCell>
            <TableCell sx={{ color: "white" }} align="center">गायब</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rental.items.map((item, idx) => (
            <TableRow
              key={item.rentalItemId}
              sx={{ backgroundColor: idx % 2 ? "#fafafa" : "white" }}
            >
              <TableCell>{item.itemName}</TableCell>
              <TableCell align="center">{item.remainingQty}</TableCell>

              {["returnedQty", "damagedQty", "missingQty"].map(field => (
                <TableCell key={field} align="center">
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: item.remainingQty }}
                    disabled={item.remainingQty === 0}
                    onChange={(e) =>
                      update(item, field, Number(e.target.value))
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
