import { Box, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const TEXT = {
  en: { title: "Not Available Yet", body: "This module hasn't been launched for your account yet. It will be enabled soon." },
  hi: { title: "अभी उपलब्ध नहीं है", body: "यह मॉड्यूल अभी आपके खाते के लिए शुरू नहीं किया गया है। यह जल्द ही उपलब्ध होगा।" },
};

export default function ModuleNotAvailable() {
  const { language } = useAuth();
  const t = TEXT[language] ?? TEXT.en;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, textAlign: "center" }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>{t.title}</Typography>
      <Typography sx={{ color: "text.secondary" }}>{t.body}</Typography>
    </Box>
  );
}
