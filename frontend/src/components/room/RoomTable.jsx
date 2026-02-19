import React from "react";
import { updateCleaningStatus } from "../../api/roomApi";

export default function RoomTable({ rooms, reload }) {
  const handleCleaningChange = async (id, status) => {
    await updateCleaningStatus(id, {
      cleaningStatus: status,
      handledBy: "counter_user",
    });
    reload();
  };

  return (
    <table border="1" width="100%">
      <thead>
        <tr>
          <th>Room</th>
          <th>Block</th>
          <th>Floor</th>
          <th>Status</th>
          <th>Cleaning</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((r) => (
          <tr key={r.id}>
            <td>{r.roomNumber}</td>
            <td>{r.blockName}</td>
            <td>{r.floor}</td>
            <td>{r.status}</td>
            <td>
              <select
                value={r.cleaningStatus}
                onChange={(e) =>
                  handleCleaningChange(r.id, e.target.value)
                }
              >
                <option value="CLEAN">CLEAN</option>
                <option value="DIRTY">DIRTY</option>
                <option value="CLEANING_IN_PROGRESS">
                  CLEANING_IN_PROGRESS
                </option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
