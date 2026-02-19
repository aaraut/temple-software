import React, { useEffect, useState } from "react";
import { getRooms } from "../../api/roomApi";
import RoomForm from "../../components/room/RoomForm";
import RoomTable from "../../components/room/RoomTable";

export default function RoomPage() {
  const [rooms, setRooms] = useState([]);

  const loadRooms = async () => {
    const data = await getRooms();
    setRooms(data);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <div>
      <RoomForm onSuccess={loadRooms} />
      <hr />
      <RoomTable rooms={rooms} reload={loadRooms} />
    </div>
  );
}
