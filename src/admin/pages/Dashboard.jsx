// frontend/src/admin/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";

const BRAND = "#0B162C";

function StatCard({ title, value, icon, className }) {
  return (
    <div className={`bg-white rounded-xl shadow p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "#F8FAFC" }}>
          <div className="text-2xl">{icon}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}

function currency(n) {
  if (n == null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCars: 0,
    activeBookings: 0,
    todaysRevenue: 0,
    totalCustomers: 0
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        // stats endpoint
        try {
          const sres = await fetch(`${base}/api/bookings/stats`);
          if (sres.ok) {
            const sdata = await sres.json();
            if (mounted) setStats(sdata);
          }
        } catch (_) {}

        // recent bookings
        const bres = await fetch(`${base}/api/bookings`);
        if (bres.ok) {
          const bdata = await bres.json();
          if (mounted) {
            setRecent(Array.isArray(bdata) ? bdata.slice(0, 6) : []);
            if (!Array.isArray(bdata) || bdata.length === 0) {
              // set default placeholders
              setStats(prev => ({ ...prev }));
            }
          }
        } else {
          if (mounted) setRecent([]);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return ()=> mounted = false;
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: BRAND }}>Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Cars" value={stats.totalCars ?? 0} icon="🚗" />
        <StatCard title="Active Bookings" value={stats.activeBookings ?? 0} icon="📅" />
        <StatCard title="Today's Revenue" value={currency(stats.todaysRevenue ?? 0)} icon="💰" />
        <StatCard title="Total Customers" value={stats.totalCustomers ?? 0} icon="👥" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: BRAND }}>Recent Bookings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-3 pr-4">Booking ID</th>
                <th className="py-3 pr-4">Customer Name</th>
                <th className="py-3 pr-4">Car</th>
                <th className="py-3 pr-4">Pickup Date / Time</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading…</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No recent bookings</td></tr>
              ) : recent.map((r) => (
                <tr key={r._id || r.bookingId} className="border-t">
                  <td className="py-4 pr-4 font-mono text-xs text-gray-700">{r.bookingId || "—"}</td>
                  <td className="py-4 pr-4">
                    <div className="font-medium">{r.customerName || "—"}</div>
                    <div className="text-xs text-gray-500">{r.customerPhone || ""}</div>
                  </td>
                  <td className="py-4 pr-4 text-gray-700">{r.carTitle || r.car || "—"}</td>
                  <td className="py-4 pr-4 text-gray-700">{r.date ? `${r.date} • ${r.time||""}` : (r.pickup||"—")}</td>
                  <td className="py-4 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${r.status === "Completed" ? "bg-green-100 text-green-700" : r.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status || "Pending"}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-semibold">₹{r.fare?.total ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-12" />
    </div>
  );
}
