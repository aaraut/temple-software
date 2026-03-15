import React, { useEffect, useState } from "react";
import {
  createRoom,
  updateRoom,
  getRoomCategories,
  getAmenities,
} from "../../api/roomApi";

export default function RoomForm({ onSuccess, editData }) {
  const [form, setForm] = useState({
    roomNumber: "",
    categoryId: "",
    blockName: "",
    floor: "",
    maxOccupancy: "",
    baseRent24Hr: "",
    baseRentFixed: "",
    baseRent3Hr: "",
    baseRent6Hr: "",
    defaultSecurityDeposit: "",
    remarks: "",
    createdBy: "admin",
    amenities: [],
  });

  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    }
  }, [editData]);

  const loadMasters = async () => {
    const cat = await getRoomCategories();
    const am = await getAmenities();
    setCategories(cat);
    setAmenities(am);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAmenityChange = (amenityId, quantity) => {
    const updated = [...form.amenities];
    const index = updated.findIndex((a) => a.amenityId === amenityId);

    if (index > -1) {
      updated[index].quantity = quantity;
    } else {
      updated.push({ amenityId, quantity });
    }

    setForm({ ...form, amenities: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editData) {
      await updateRoom(editData.id, form);
    } else {
      await createRoom(form);
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{editData ? "Update Room" : "Create Room"}</h3>

      <input
        name="roomNumber"
        placeholder="Room Number"
        value={form.roomNumber}
        onChange={handleChange}
        required
      />

      <select
        name="categoryId"
        value={form.categoryId}
        onChange={handleChange}
        required
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        name="blockName"
        placeholder="Block"
        value={form.blockName}
        onChange={handleChange}
      />

      <input
        name="floor"
        placeholder="Floor"
        value={form.floor}
        onChange={handleChange}
      />

      <input
        name="maxOccupancy"
        type="number"
        placeholder="Max Occupancy"
        value={form.maxOccupancy}
        onChange={handleChange}
      />

      <input
        name="baseRent24Hr"
        type="number"
        placeholder="24Hr Rent"
        value={form.baseRent24Hr}
        onChange={handleChange}
      />

      <input
        name="baseRentFixed"
        type="number"
        placeholder="Fixed Rent"
        value={form.baseRentFixed}
        onChange={handleChange}
      />

      <input
        name="baseRent3Hr"
        type="number"
        placeholder="3Hr Rent"
        value={form.baseRent3Hr}
        onChange={handleChange}
      />

      <input
        name="baseRent6Hr"
        type="number"
        placeholder="6Hr Rent"
        value={form.baseRent6Hr}
        onChange={handleChange}
      />

      <input
        name="defaultSecurityDeposit"
        type="number"
        placeholder="Security Deposit"
        value={form.defaultSecurityDeposit}
        onChange={handleChange}
      />

      <textarea
        name="remarks"
        placeholder="Remarks"
        value={form.remarks}
        onChange={handleChange}
      />

      <h4>Amenities</h4>
      {amenities.map((a) => (
        <div key={a.id}>
          <label>{a.name}</label>
          <input
            type="number"
            min="0"
            onChange={(e) =>
              handleAmenityChange(a.id, Number(e.target.value))
            }
          />
        </div>
      ))}

      <button type="submit">
        {editData ? "Update Room" : "Create Room"}
      </button>
    </form>
  );
}
