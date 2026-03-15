import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

export default function PurposeSelect({
  purposes,
  language,
  value,
  onChange,
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>
        {language === "hi" ? "दान का उद्देश्य" : "Donation Purpose"}
      </InputLabel>

      <Select
        value={value || ""}
        label={language === "hi" ? "दान का उद्देश्य" : "Donation Purpose"}
        onChange={e => onChange(e.target.value)}
      >
        {purposes.map(p => (
          <MenuItem key={p.id} value={p.id}>
            {language === "hi" ? p.nameHi : p.nameEn}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
