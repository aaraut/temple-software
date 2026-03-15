import { Box, TextField, MenuItem, Button, Stack } from "@mui/material";

const categories = [
  { value: "", label: "सभी" },
  { value: "BARTAN", label: "बर्तन" },
  { value: "BICHAYAT", label: "बिछायत" }
];

// ---------- date helpers ----------
const format = (d) => d.toISOString().slice(0, 10);

const todayRange = () => {
  const today = new Date();
  return {
    fromDate: format(today),
    toDate: format(today)
  };
};

const thisWeekRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    fromDate: format(monday),
    toDate: format(sunday)
  };
};

const thisMonthRange = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fromDate: format(first),
    toDate: format(last)
  };
};

export default function ReportFilters({
  filters,
  onChange,
  showCategory = true
}) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* -------- Preset Buttons -------- */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange({ ...filters, ...todayRange() })}
        >
          आज
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange({ ...filters, ...thisWeekRange() })}
        >
          इस सप्ताह
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange({ ...filters, ...thisMonthRange() })}
        >
          इस माह
        </Button>
      </Stack>

      {/* -------- Date & Category Filters -------- */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <TextField
          label="From Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.fromDate || ""}
          onChange={(e) =>
            onChange({ ...filters, fromDate: e.target.value })
          }
        />

        <TextField
          label="To Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.toDate || ""}
          onChange={(e) =>
            onChange({ ...filters, toDate: e.target.value })
          }
        />

        {showCategory && (
          <TextField
            select
            label="श्रेणी"
            value={filters.category || ""}
            onChange={(e) =>
              onChange({ ...filters, category: e.target.value })
            }
            sx={{ minWidth: 160 }}
          >
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>
    </Box>
  );
}
