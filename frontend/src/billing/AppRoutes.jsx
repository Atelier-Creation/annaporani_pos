// src/billing/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import BillingList from "./pages/billingList";
import BillingForm from "./pages/billingForm";
import CustomerBillingForm from "./pages/CustomerBillingForm";
import CustomerBillCopy from "./pages/CustomerBillCopy";
import SalesReport from "./pages/SalesReport";
import SourceWiseReport from "./pages/SourceWiseReport";
import POSPage from "./pages/POSPage";
import { List, PlusCircle, UserPlus, BarChart, ShoppingCart, MonitorSmartphone } from "lucide-react";
import ComingSoon from "./pages/ComingSoon";
import { Tooltip } from "antd";
export const billingMenuItems = [
  {
    key: "/billing/list",
    label: "Billing List",
    icon: <List size={18} />,
  },
  {
    key: "/billing/pos",
    label: "POS Terminal",
    icon: <MonitorSmartphone size={18} />,
  },
  {
    key: "/billing/self-checkout",
    label: (
      <Tooltip title="Coming Soon">
        <span style={{ cursor: "not-allowed", color: "#999" }}>
          Self Checkout
        </span>
      </Tooltip>
    ),
    icon: (
      <Tooltip title="Coming Soon">
        <ShoppingCart size={18} color="#999" />
      </Tooltip>
    ),
    disabled: true, // This disables click visually via cursor
    noRoute: true, // This disables click programmatically in Sidebar
  }
];

const BillingRoutes = () => {
  return (
    <Routes>
      <Route path="list" element={<BillingList />} />
      <Route path="add" element={<BillingForm />} />
      <Route path="pos" element={<POSPage />} />
      <Route path="edit/:id" element={<BillingForm />} />
      <Route path="self-checkout" element={<ComingSoon />} />
      <Route path="customer-copy" element={<CustomerBillCopy />} />
      <Route path="customer-copy/:id" element={<CustomerBillCopy />} />
      <Route path="reports" element={<SalesReport />} />
      <Route path="source-wise-report" element={<SourceWiseReport />} />
    </Routes>
  );
};

export default BillingRoutes;
