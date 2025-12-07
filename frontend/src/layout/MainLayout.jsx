import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="w-5/6 mx-auto px-4 py-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
