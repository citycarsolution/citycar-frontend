import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const linkClass =
    "block px-4 py-2 rounded hover:bg-gray-200 transition font-medium";

  return (
    <div className="w-56 bg-white border-r h-full p-4 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

      <NavLink to="/admin/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/admin/bookings" className={linkClass}>
        Bookings
      </NavLink>
      <NavLink to="/admin/drivers" className={linkClass}>
        Drivers
      </NavLink>
      <NavLink to="/admin/cars" className={linkClass}>
        Cars
      </NavLink>
    </div>
  );
}
