import { Box, Typography } from "@mui/material";

const TEXT = {
  en: { title: "Desktop Only", body: "This software is designed for counter/desktop use only and cannot be used on a mobile phone or tablet. Please use a desktop or laptop computer." },
  hi: { title: "केवल डेस्कटॉप के लिए", body: "यह सॉफ़्टवेयर केवल काउंटर/डेस्कटॉप उपयोग के लिए बनाया गया है और मोबाइल फ़ोन या टैबलेट पर उपयोग नहीं किया जा सकता। कृपया डेस्कटॉप या लैपटॉप कंप्यूटर का उपयोग करें।" },
};

export default function MobileBlocked() {
  const lang = (navigator.language || "en").startsWith("hi") ? "hi" : "en";
  const t = TEXT[lang];

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      px: 4, background: "#fdf9f4",
    }}>
      <Typography sx={{ fontSize: 48, mb: 2 }}>🖥️</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#2d1f0f" }}>{t.title}</Typography>
      <Typography sx={{ color: "#8a7560", maxWidth: 420 }}>{t.body}</Typography>
    </Box>
  );
}
