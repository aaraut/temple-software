import { useEffect, useState } from "react";
import { Snackbar, Alert, Box } from "@mui/material";
import { useLocation } from "react-router-dom";
import { createRentalAndPrint  } from "../../api/rentalApi";
import { getInventoryItems } from "../../api/inventoryApi";
import { useAuth } from "../../context/AuthContext";
import RentalIssueForm from "../../components/rental/RentalIssueForm";

export default function RentalIssuePage() {
  const { auth, language } = useAuth();   // ← global language
  const location = useLocation();

  const category = location.pathname.includes("bichayat")
    ? "BICHAYAT"
    : "BARTAN";

  const [inventory, setInventory] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);


  useEffect(() => {
  console.log("Inventory loaded:", inventory);
}, [inventory]);

  useEffect(() => {
    setResetKey(prev => prev + 1);
  }, [category]);

  useEffect(() => {
  async function loadInventory() {
    try {
      console.log("Category requested:", category);

      const data = await getInventoryItems(category);

      console.log("Inventory response for", category, ":", data);

      setInventory(data);
    } catch (e) {
      console.error("Inventory load failed", e);
      setError("Inventory लोड नहीं हो सका");
    }
  }

  loadInventory();
}, [category]);



  const handleSubmit = async (form) => {
  setError("");
  setSuccess("");

  try {
    const payload = {
      ...form,
      category
    };

    // 🔥 Call create-and-print API
    const pdfBlob = await createRentalAndPrint(
      payload,
      auth.username
    );

    // Open PDF
    const file = new Blob([pdfBlob], {
      type: "application/pdf"
    });

    const fileURL = window.URL.createObjectURL(file);
    window.open(fileURL);

    // Success message
    setSuccess("किराया सफलतापूर्वक दर्ज हुआ और रसीद प्रिंट हो रही है।");

    // Reset form
    setResetKey(prev => prev + 1);

  } catch (e) {
    setError(
      e.response?.data?.message ||
      "किराया दर्ज करने में त्रुटि"
    );
  }
};

  return (
    <Box sx={{ maxWidth: 1000, margin: "auto" }}>
      <RentalIssueForm
        inventory={inventory}
        language={language}
        category={category}
        onSubmit={handleSubmit}
        key={resetKey}
      />

      <Snackbar open={!!success} autoHideDuration={15000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
