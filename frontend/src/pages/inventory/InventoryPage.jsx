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




const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const location = useLocation();
    
    const CATEGORY = location.pathname.includes("bichayat")
        ? "BICHAYAT"
        : "BARTAN";

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
        setEditingItem(null); // reset form on category switch
        loadItems();
    }, [CATEGORY]);

  const handleSubmit = async (data) => {
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    if (data.id) {
      await updateInventoryItem(data.id, data);
      setSuccess("Inventory item updated successfully");
    } else {
      await createInventoryItem(data);
      setSuccess("Inventory item added successfully");
    }

    setEditingItem(null);
    loadItems();
  } catch (e) {
    setError(
      e.response?.data?.message ||
        "Failed to save inventory item"
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <>

        <Typography variant="h5" sx={{ mb: 2 }}>
            {CATEGORY === "BARTAN" ? "Bartan Inventory" : "Bichayat Inventory"}
        </Typography>
      <InventoryForm
        category={CATEGORY}
        editingItem={editingItem}
        onSubmit={handleSubmit}
        onCancel={() => setEditingItem(null)}
        loading={loading}
        />


      <InventoryTable
        items={items}
        loading={loading}
        onEdit={setEditingItem}
         category={CATEGORY}
      />

      {/* Success Toast */}
        <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess("")}
        >
        <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
        </Alert>
        </Snackbar>

        {/* Error Toast */}
        <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        >
        <Alert severity="error" onClose={() => setError("")}>
            {error}
        </Alert>
        </Snackbar>

    </>
  );
};

export default InventoryPage;
