import { Routes, Route } from "react-router-dom";
import SubcategoryList from "../Product/pages/SubcategoryList";
import SubcategoryForm from "../Product/pages/SubcategoryForm";
import { List, PlusCircle } from "lucide-react";

// Sidebar menu items for Subcategory
export const subcategoryMenuItems = [
  {
    key: "/subcategory/list",
    label: "Subcategory List",
    icon: <List size={18} />,
  },
  {
    key: "/subcategory/add",
    label: "Add Subcategory",
    icon: <PlusCircle size={18} />,
  },
];

const SubcategoryRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<SubcategoryList />} />
      <Route path="add" element={<SubcategoryForm />} />
      <Route path="edit/:id" element={<SubcategoryForm />} />
    </Routes>
  );
};

export default SubcategoryRoutes;
