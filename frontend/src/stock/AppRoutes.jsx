import { Routes, Route } from "react-router-dom";
import StockList from "./pages/StockList";
import { List } from "lucide-react";

export const stockMenuItems = [
  {
    key: "/stock/list",
    label: "Stock List",
    icon: <List size={18} />
  }
];

const StockRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<StockList />} />
    </Routes>
  );
};

export default StockRoutes;