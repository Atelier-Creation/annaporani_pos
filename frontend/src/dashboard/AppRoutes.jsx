import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardFull from "./pages/dashboardFull";
import { LayoutDashboard } from "lucide-react";

export const dashboardMenuItems = [
  {
    key: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
  },
];

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* index → matches /dashboard */}
      <Route index element={<DashboardFull />} />
    </Routes>
  );
};

export default DashboardRoutes;
