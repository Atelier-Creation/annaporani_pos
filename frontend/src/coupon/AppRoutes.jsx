import { Routes, Route } from "react-router-dom";
import CouponValidator from "./pages/CouponValidator";
import CustomerCoupons from "./pages/CustomerCoupons";
import PointsManagement from "./pages/PointsManagement";
import { CheckCircle, Ticket, Award } from "lucide-react";

export const couponMenuItems = [
  {
    key: "/coupon/validate",
    label: "Validate Coupon",
    icon: <CheckCircle size={18} />,
  },
  {
    key: "/coupon/customer-coupons",
    label: "Customer Coupons",
    icon: <Ticket size={18} />,
  },
  {
    key: "/coupon/points",
    label: "Points Management",
    icon: <Award size={18} />,
  },
];

const CouponRoutes = () => {
  return (
    <Routes>
      <Route path="validate" element={<CouponValidator />} />
      <Route path="customer-coupons" element={<CustomerCoupons />} />
      <Route path="points" element={<PointsManagement />} />
    </Routes>
  );
};

export default CouponRoutes;
