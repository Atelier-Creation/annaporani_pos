// src/inward/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import InwardList from "./pages/InwardList";
import InwardForm from "./pages/InwardForm";
import { List, PlusCircle } from "lucide-react";

export const inwardMenuItems = [
  {
    key: "/inward/list",
    label: "Inward List",
    icon: <List size={18} />,
  },
  {
    key: "/inward/add",
    label: "Add Inward",
    icon: <PlusCircle size={18} />,
  },
];

const InwardRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<InwardList />} />
      <Route path="add" element={<InwardForm />} />
      <Route path="edit/:id" element={<InwardForm />} />
    </Routes>
  );
};

export default InwardRoutes;
