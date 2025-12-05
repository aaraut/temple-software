// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GotraList from "./pages/GotraList";

function Home() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Temple Admin PWA</h1>
      <nav>
        <Link to="/gotra" style={{ marginRight: 12 }}>
          Gotra Master
        </Link>
      </nav>
      <p>Use the menu above to manage masters.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gotra" element={<GotraList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
