import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function LanguageToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, lang) => lang && onChange(lang)}
      size="small"
    >
      <ToggleButton value="hi">हिंदी</ToggleButton>
      <ToggleButton value="en">English</ToggleButton>
    </ToggleButtonGroup>
  );
}
