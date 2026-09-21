import { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox, Paper, CircularProgress, Alert,
} from "@mui/material";
import { listModuleAccess, updateModuleAccess } from "../../api/moduleAccessApi";
import { useAuth } from "../../context/AuthContext";

const TEXT = {
  en: {
    title: "Module Access", subtitle: "Control which modules are visible to Admin and User accounts",
    module: "Module", visibleAdmin: "Visible to Admin", visibleUser: "Visible to User",
    note: "Changes take effect the next time each user logs in.",
    error: "Failed to load module access settings",
  },
  hi: {
    title: "मॉड्यूल एक्सेस", subtitle: "एडमिन और यूज़र के लिए मॉड्यूल दृश्यता नियंत्रित करें",
    module: "मॉड्यूल", visibleAdmin: "एडमिन को दिखे", visibleUser: "यूज़र को दिखे",
    note: "बदलाव अगली बार लॉगिन करने पर लागू होंगे।",
    error: "मॉड्यूल एक्सेस सेटिंग्स लोड करने में विफल",
  },
};

export default function ModuleAccessSettings() {
  const { language } = useAuth();
  const t = TEXT[language] ?? TEXT.en;

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listModuleAccess()
      .then(setModules)
      .catch(() => setError(t.error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (module, field) => {
    const updated = { ...module, [field]: !module[field] };
    setModules((prev) => prev.map((m) => (m.id === module.id ? updated : m)));

    try {
      await updateModuleAccess(module.id, updated.enabledForAdmin, updated.enabledForUser);
    } catch {
      setModules((prev) => prev.map((m) => (m.id === module.id ? module : m)));
      setError(t.error);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>{t.title}</Typography>
      <Typography sx={{ color: "text.secondary", mb: 2 }}>{t.subtitle}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.module}</TableCell>
              <TableCell align="center">{t.visibleAdmin}</TableCell>
              <TableCell align="center">{t.visibleUser}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell>{module.displayName}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={module.enabledForAdmin}
                    onChange={() => handleToggle(module, "enabledForAdmin")}
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={module.enabledForUser}
                    onChange={() => handleToggle(module, "enabledForUser")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "0.85rem" }}>{t.note}</Typography>
    </Box>
  );
}
