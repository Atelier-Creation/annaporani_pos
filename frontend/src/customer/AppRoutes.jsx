import { Routes, Route } from "react-router-dom";
import CustomerList from "./pages/CustomerList";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetails from "./pages/CustomerDetails";
import { List, UserPlus } from "lucide-react";

export const customerMenuItems = [
  {
    key: "/customer/list",
    label: "Customer List",
    icon: <List size={18} />,
  },
  {
    key: "/customer/add",
    label: "Add Customer",
    icon: <UserPlus size={18} />,
  },
];

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<CustomerList />} />
      <Route path="add" element={<CustomerForm />} />
      <Route path="edit/:id" element={<CustomerForm />} />
      <Route path="details/:id" element={<CustomerDetails />} />
    </Routes>
  );
};

export default CustomerRoutes;
