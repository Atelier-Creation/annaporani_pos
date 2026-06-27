import { Suspense, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/Mainlayout";
import { useAuth } from "./context/AuthContext";
import {
  LayoutDashboard,
  IndianRupee,
  Box,
  Tags,
  Layers,
  ShoppingCart,
  Database,
  Users,
  Percent,
  User,
  BarChart,
  Megaphone,
  UserCheck,
  TrendingUp,
  Ticket
} from "lucide-react";
import CustomerBillCopy from "./billing/pages/CustomerBillCopy";
import CustomerBillForm from "./billing/pages/CustomerBillingForm";
import Login from "./login/Login";
import EmployeeLogin from "./login/EmployeeLogin";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext";
import ProtectedEmployeeRoute from "./context/ProtectedEmployeeRoute";
import EmployeeLayout from "./components/layout/EmployeeLayout";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import EmployeeOverview from "./employee/pages/EmployeeOverview";
import EmployeeAttendance from "./employee/pages/EmployeeAttendance";
import EmployeeLeaves from "./employee/pages/EmployeeLeaves";
import EmployeeLeaveBalance from "./employee/pages/EmployeeLeaveBalance";
import EmployeeDocuments from "./employee/pages/EmployeeDocuments";
import EmployeePayslip from "./employee/pages/EmployeePayslip";
import EmployeeAdvance from "./employee/pages/EmployeeAdvance";
import Loading from "./utils/Loading";
import Settings from "./components/pages/Settings";
import ComingSoon from "./billing/pages/ComingSoon";
import DeveloperLogin from "./ticket/pages/DeveloperLogin";
import DeveloperPortal from "./ticket/pages/DeveloperPortal";

const routeModules = import.meta.glob("./*/AppRoutes.jsx", { eager: true });

const moduleIcons = {
  dashboard: <LayoutDashboard size={20} />,
  billing: <IndianRupee size={20} />,
  Product: <Box size={20} />,
  Category: <Tags size={20} />,
  subcategory: <Layers size={20} />,
  inward: <ShoppingCart size={20} />,
  stock: <Database size={20} />,
  customer: <Users size={20} />,
  coupon: <Percent size={20} />,
  user: <User size={20} />,
  marketing: <Megaphone size={20} />,
  employee: <UserCheck size={20} />,
  ticket: <Ticket size={20} />,
};
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmployeeAuthProvider>
          <BranchProvider>
            <Loading duration={3000} />
            <Suspense fallback={<div className="p-4"><Loading /></div>}>
              <AppInner />
            </Suspense>
          </BranchProvider>
        </EmployeeAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

function AppInner() {
  const { user } = useAuth();
  const userRoleName = (user?.role?.role_name || user?.role_name || '').toLowerCase();
  const isSuperAdmin = userRoleName === 'super admin' || userRoleName === 'super admin';
  const modules = Object.entries(routeModules).map(([path, mod]) => {
    const match = path.match(/\.\/(.*?)\/AppRoutes\.jsx$/);
    const name = match?.[1];

    return {
      name,
      path: `/${name}/*`,
      element: mod.default,
      menuItems: mod[`${name}MenuItems`] || [],
    };
  });

  const menuItems = useMemo(() => {
    const items = modules
      .filter(({ name }) => name !== "Category" && name !== "subcategory")
      .map(({ name, menuItems }) => {

        // Dashboard direct route
        if (name === "dashboard") {
          return {
            key: "/dashboard",
            icon: moduleIcons[name] || null,
            label: "Dashboard",
            children: null,
          };
        }

        // ✅ If only ONE child → make it direct route
        if (menuItems && menuItems.length === 1) {
          return {
            key: menuItems[0].key,   // use actual child route
            icon: moduleIcons[name] || null,
            label: name.charAt(0).toUpperCase() + name.slice(1),
            children: null,
          };
        }

        // ✅ If MULTIPLE children → dropdown
        if (menuItems && menuItems.length > 1) {
          // For ticket module: hide Developers item for non-super-admins
          const filteredChildren = name === "ticket"
            ? menuItems.filter(item => item.key !== "/ticket/developers" || isSuperAdmin)
            : menuItems;

          return {
            key: name,
            icon: moduleIcons[name] || null,
            label: name.charAt(0).toUpperCase() + name.slice(1),
            children: filteredChildren,
          };
        }

        // ✅ If NO children → direct route fallback
        return {
          key: `/${name}`,
          icon: moduleIcons[name] || null,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          children: null,
        };
      });

    // Add Sales Report manually
    items.push({
      key: "/billing/reports",
      label: "Sales Report",
      icon: <BarChart size={20} />,
      children: null
    });

    // Add Source-wise Report manually
    items.push({
      key: "/billing/source-wise-report",
      label: "Source-wise Report",
      icon: <TrendingUp size={20} />,
      children: null
    });

    // Keep dashboard first
    items.sort((a, b) => {
      if (a.key === "/dashboard") return -1;
      if (b.key === "/dashboard") return 1;
      return 0;
    });

    return items;
  }, [modules]);

  const getDefaultRedirect = () => {
    const filteredModules = modules.filter((mod) => mod.name !== "dashboard");
    return filteredModules.length > 0
      ? `/${filteredModules[0].name}/pages/dashboard`
      : "/404";
  };

  return (
    <Routes>
      {/* Public/Login routes */}
      <Route path="/" element={<Login />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route path="/developer-login" element={<DeveloperLogin />} />
      <Route path="/developer/tickets" element={<DeveloperPortal />} />

      {/* Employee portal — outside admin layout, uses its own layout */}
      <Route
        path="/employee-dashboard"
        element={
          <ProtectedEmployeeRoute>
            <EmployeeLayout />
          </ProtectedEmployeeRoute>
        }
      >
        <Route index element={<EmployeeOverview />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="leaves" element={<EmployeeLeaves />} />
        <Route path="balance" element={<EmployeeLeaveBalance />} />
        <Route path="documents" element={<EmployeeDocuments />} />
        <Route path="payslips" element={<EmployeePayslip />} />
        <Route path="advance" element={<EmployeeAdvance />} />
      </Route>
      {/* Routes WITHOUT sidebar/header */}
      <Route
        path="/billing/customer-copy"
        element={
          <ProtectedRoute>
            <CustomerBillCopy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/customer-copy/:id"
        element={
          <ProtectedRoute>
            <CustomerBillCopy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/customer-add"
        element={
          <ProtectedRoute>
            <CustomerBillForm />
          </ProtectedRoute>
        }
      />

      {/* Routes WITH sidebar/header */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout menuItems={menuItems} />
          </ProtectedRoute>
        }
      >
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

        {modules.map(({ name, path, element: Element }) => (
          <Route
            key={name}
            path={path}
            element={
              <ProtectedRoute>
                <Element />
              </ProtectedRoute>
            }
          />
        ))}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<div className="p-4 text-red-500">404 - Page Not Found</div>}
        />
      </Route>
    </Routes>
  );
}

export default App;
