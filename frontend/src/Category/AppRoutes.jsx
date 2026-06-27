import { Routes, Route } from "react-router-dom";
import CategoryList from "../Product/pages/CategoryList";
import CategoryAdd from "../Product/pages/CategoryAdd";
import SubcategoryList from "../Product/pages/SubcategoryList";
import SubcategoryForm from "../Product/pages/SubcategoryForm";
import { Tags, Layers } from "lucide-react";

export const CategoryMenuItems = [
  {
    key: "/Category/categories",
    label: "Categories",
    icon: <Tags size={18} />,
  },
  {
    key: "/Category/subcategories",
    label: "Subcategories",
    icon: <Layers size={18} />,
  },
];

const CategoryRoutes = () => {
  return (
    <Routes>
      <Route path="categories" element={<CategoryList />} />
      <Route path="categories/add" element={<CategoryAdd />} />
      <Route path="categories/edit/:id" element={<CategoryAdd />} />

      <Route path="subcategories" element={<SubcategoryList />} />
      <Route path="subcategories/add" element={<SubcategoryForm />} />
      <Route path="subcategories/edit/:id" element={<SubcategoryForm />} />
    </Routes>
  );
};

export default CategoryRoutes;
