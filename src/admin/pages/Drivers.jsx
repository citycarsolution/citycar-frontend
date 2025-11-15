import React, { useEffect, useState } from "react";

/**
 * DriversPage
 * - left: Add Driver form
 * - right: Driver List cards (matching your screenshot layout)
 * - Cancel button calls DELETE /api/drivers/:id
 */
export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [adding, setAdding] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/drivers`);
      if (!res.ok) {
        const txt = await res.text();
        console.error("fetchDrivers non-OK:", res.status, txt);
        throw new Error("Failed to load drivers");
      }
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.drivers || [];
      setDrivers(arr);
    } catch (err) {
      console.error("fetchDrivers error:", err);
      alert("Failed to load drivers (see console).");
    } finally {
      setLoading(false);
    }
  }

  async function addDriver(e) {
    e?.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please enter name and phone.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), carModel: carModel.trim() })
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("addDriver failed:", res.status, txt);
        throw new Error("Add driver failed");
      }
      const newDriver = await res.json();
      // if API returns object or array, normalize
      const drv = newDriver && newDriver._id ? newDriver : (Array.isArray(newDriver) ? newDriver[0] : newDriver.driver || newDriver);
      // prepend to list
      setDrivers(prev => [drv, ...prev]);
      setName(""); setPhone(""); setCarModel("");
    } catch (err) {
      console.error("addDriver error:", err);
      alert("Failed to add driver.");
    } finally {
      setAdding(false);
    }
  }

  async function handleCancel(driverId, driverName) {
    const ok = window.confirm(`Are you sure you want to cancel/remove driver "${driverName}"?`);
    if (!ok) return;
    setBusyId(driverId);
    try {
      const res = await fetch(`${API_BASE}/api/drivers/${driverId}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        console.error("cancel driver failed:", res.status, txt);
        throw new Error("Cancel failed");
      }
      setDrivers(prev => prev.filter(d => String(d._id || d.id) !== String(driverId)));
    } catch (err) {
      console.error("handleCancel error:", err);
      alert("Failed to cancel driver.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Drivers</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Add Driver card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-medium mb-4">Add Driver</h3>
          <form onSubmit={addDriver} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-3 border rounded-md text-sm placeholder-gray-400"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (with country code e.g. 91987...)"
              className="w-full p-3 border rounded-md text-sm placeholder-gray-400"
            />
            <input
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="Car Model"
              className="w-full p-3 border rounded-md text-sm placeholder-gray-400"
            />

            <div>
              <button
                type="submit"
                disabled={adding}
                className={`px-4 py-2 rounded-md text-white font-medium ${adding ? "bg-gray-400 cursor-wait" : "bg-[#0B162C]"}`}
              >
                {adding ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Driver List card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-medium mb-4">Driver List</h3>

          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : drivers.length === 0 ? (
            <div className="text-gray-600">No drivers found.</div>
          ) : (
            <ul className="space-y-4">
              {drivers.map(d => {
                const id = d._id || d.id;
                return (
                  <li key={id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <div className="font-medium text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.phone} • {d.carModel}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                        {d.status || (d.available ? "Available" : "—")}
                      </span>

                      <button
                        disabled={busyId === String(id)}
                        onClick={() => handleCancel(id, d.name)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${busyId === String(id) ? "opacity-60 cursor-wait bg-red-300 text-white" : "bg-red-500 text-white hover:bg-red-600"}`}
                      >
                        {busyId === String(id) ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
