import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppHome from "./AppHome.jsx";
import AdminApp from "./admin/AdminApp.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AppHome />} />
          <Route path="/admin/*" element={<AdminApp />} />
          {/* safety: unknown urls -> home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}