import { Routes, Route } from "react-router-dom";
import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import ProductBulkUpload from "./pages/ProductBulkUpload";
import CategoryList from "./pages/CategoryList";
import CategoryAdd from "./pages/CategoryAdd";
import SubcategoryList from "./pages/SubcategoryList";
import SubcategoryForm from "./pages/SubcategoryForm";
import { List, Tags, Layers, Upload } from "lucide-react";

export const ProductMenuItems = [
  {
    key: "/Product/list",
    label: "Products",
    icon: <List size={18} />,
  },
  {
    key: "/Product/bulk-upload",
    label: "Bulk Upload",
    icon: <Upload size={18} />,
  },
  {
    key: "/Product/categories",
    label: "Categories",
    icon: <Tags size={18} />,
  },
  {
    key: "/Product/subcategories",
    label: "Subcategories",
    icon: <Layers size={18} />,
  },
];

const ProductRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<ProductList />} />
      <Route path="add" element={<ProductForm />} />
      <Route path="edit/:id" element={<ProductForm />} />
      <Route path="bulk-upload" element={<ProductBulkUpload />} />

      <Route path="categories" element={<CategoryList />} />
      <Route path="categories/add" element={<CategoryAdd />} />
      <Route path="categories/edit/:id" element={<CategoryAdd />} />

      <Route path="subcategories" element={<SubcategoryList />} />
      <Route path="subcategories/add" element={<SubcategoryForm />} />
      <Route path="subcategories/edit/:id" element={<SubcategoryForm />} />
    </Routes>
  );
};

export default ProductRoutes;
