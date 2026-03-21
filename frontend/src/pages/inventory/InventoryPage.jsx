import React, { useEffect, useState } from "react";
import InventoryForm from "../../components/inventory/InventoryForm";
import InventoryTable from "../../components/inventory/InventoryTable";
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
} from "../../api/inventoryApi";
import { Snackbar, Alert, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const { language } = useAuth();

  const CATEGORY = location.pathname.includes("bichayat") ? "BICHAYAT" : "BARTAN";

  const titles = {
    en: { BARTAN: "Bartan Inventory", BICHAYAT: "Bichayat Inventory" },
    hi: { BARTAN: "बर्तन सूची",       BICHAYAT: "बिछायत सूची" },
  };

  const msgs = {
    en: { updated: "Inventory item updated successfully", added: "Inventory item added successfully", failed: "Failed to save inventory item" },
    hi: { updated: "सामग्री सफलतापूर्वक अपडेट हुई", added: "सामग्री सफलतापूर्वक जोड़ी गई", failed: "सामग्री सहेजने में त्रुटि" },
  };
  const m = msgs[language] ?? msgs.en;

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getInventoryItems(CATEGORY);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditingItem(null);
    loadItems();
  }, [CATEGORY]);

  const handleSubmit = async (data) => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (data.id) {
        await updateInventoryItem(data.id, data);
        setSuccess(m.updated);
      } else {
        await createInventoryItem(data);
        setSuccess(m.added);
      }
      setEditingItem(null);
      loadItems();
    } catch (e) {
      setError(e.response?.data?.message || m.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {(titles[language] ?? titles.en)[CATEGORY]}
      </Typography>

      <InventoryForm
        category={CATEGORY}
        editingItem={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => setEditingItem(null)}
        loading={loading}
        language={language}
      />

      <InventoryTable
        items={items}
        loading={loading}
        onEdit={setEditingItem}
        category={CATEGORY}
        language={language}
      />

      <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess("")}>
        <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
    </>
  );
};

export default InventoryPage;
