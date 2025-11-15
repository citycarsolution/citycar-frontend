// frontend/src/admin/AdminApp.jsx
import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Bookings from "./pages/Bookings";
import Drivers from "./pages/Drivers";
import Cars from "./pages/Cars";
import Dashboard from "./pages/Dashboard";

export default function AdminApp() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 p-6 bg-[#0B162C] text-white">
        <h2 className="text-2xl font-bold mb-6">CityCar Admin</h2>
        <nav className="space-y-3">
          <NavLink to="/admin" end className={({isActive})=> isActive? "block font-semibold underline":"block text-gray-200"}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/bookings" className={({isActive})=> isActive? "block font-semibold":"block text-gray-200"}>Bookings</NavLink>
          <NavLink to="/admin/drivers" className={({isActive})=> isActive? "block font-semibold":"block text-gray-200"}>Drivers</NavLink>
          <NavLink to="/admin/cars" className={({isActive})=> isActive? "block font-semibold":"block text-gray-200"}>Cars</NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="cars" element={<Cars />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
