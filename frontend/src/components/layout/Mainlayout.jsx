import React, { useState, useEffect } from "react";
import {
  Layout,
  ConfigProvider,
  Drawer,
  Button,
  Radio,
  Tabs,
  Tooltip,
  Card,
} from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import HeaderBar from "./Header";
import {
  SettingOutlined,
  CheckOutlined,
  BgColorsOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { SketchPicker } from "react-color";
import { useTheme } from "../../context/ThemeContext";
import AppFooter from "./Footer";

const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const MainLayout = ({ menuItems }) => {
  // 🔁 Default collapsed is true as requested
  const [collapsed, setCollapsed] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const {
    theme,
    setTheme,
    layoutType,
    primaryColor,
    setPrimaryColor,
    contentBgColor,
    setContentBgColor,
    headerBgColor,
    headerGradient,
    setHeaderGradient,
    sidebarBgColor,
    setSidebarBgColor,
    footerBgColor,
    setFooterBgColor,
    resetTheme,
    commonColorSchemes,
    applyCommonColorScheme,
    createGradientFromColor,
  } = useTheme();

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const openSettings = () => setSettingsVisible(true);
  const closeSettings = () => setSettingsVisible(false);

  // fallback menu items (used when parent doesn't pass menuItems)
  const defaultMenuItems = [
    { key: "/dashboard", label: "Dashboard", icon: null },
    {
      key: "Customers Billing",
      label: "Customers Billing",
      children: [{ key: "/billing/customer-add", label: "Add Customer Billing" }],
    },
    {
      key: "Product",
      label: "Product",
      children: [
        { key: "/product/list", label: "Product List" },
        { key: "/product/add", label: "Add Product" },
        { key: "/category/list", label: "Category List" },
        { key: "/category/add", label: "Add Category" },
        { key: "/subcategory/list", label: "Subcategory List" },
        { key: "/subcategory/add", label: "Add Subcategory" },
      ],
    },
    {
      key: "Billing",
      label: "Billing",
      children: [
        { key: "/billing/list", label: "Billing List" },
        { key: "/billing/add", label: "Add Billing" },
      ],
    },
    {
      key: "Inward",
      label: "Inward",
      children: [
        { key: "/inward/list", label: "Inward List" },
        { key: "/inward/add", label: "Add Inward" },
      ],
    },
    { key: "/stock/list", label: "Stocks" },
  ];

  // Use provided menuItems if available otherwise fallback
  const menuItemsToUse = menuItems && menuItems.length ? menuItems : defaultMenuItems;

  // New: expose setCollapsed to Sidebar so mobile can close
  const [color1, setColor1] = useState("#ff0000");
  const [color2, setColor2] = useState("#0000ff");

  const updateGradient = (c1, c2) => {
    const gradient = `linear-gradient(to right, ${c1}, ${c2})`;
    setHeaderGradient(gradient);
  };

  // Function to close submenu
  const closeSubMenu = () => setSelectedParent(null);

  // Handle content click to close submenu
  const handleContentClick = () => {
    if (selectedParent) {
      closeSubMenu();
    }
  };

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Predefined gradients
  const predefinedGradients = [
    { name: "Violet to Purple", value: "linear-gradient(to right, #8e2de2, #4a00e0)" },
    { name: "Blue to Purple", value: "linear-gradient(to right, #4facfe, #00f2fe)" },
    { name: "Green to Blue", value: "linear-gradient(to right, #43cea2, #185a9d)" },
    { name: "Orange to Red", value: "linear-gradient(to right, #ff8008, #ffc837)" },
    { name: "Pink to Orange", value: "linear-gradient(to right, #ff6a88, #ff99ac)" },
  ];

  // Toggle color picker visibility
  const toggleColorPicker = (pickerName) => {
    setActiveColorPicker(activeColorPicker === pickerName ? null : pickerName);
  };

  // Handle primary color change
  const handlePrimaryColorChange = (color) => {
    setPrimaryColor(color.hex);
  };

  // Added missing function referenced in UI
  const handleGradientSelect = (gradient) => {
    setHeaderGradient(gradient);
    setActiveColorPicker(null);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <Layout
        className="min-h-screen"
        style={{
          maxWidth: layoutType === "boxed" ? "1200px" : "100%",
          margin: layoutType === "boxed" ? "0 auto" : 0,
        }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            collapsedWidth={80}
            theme={theme}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 100,
              backgroundColor: theme === "dark" ? "#001529" : sidebarBgColor,
            }}
          >
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              menuItems={menuItemsToUse}
              selectedParent={selectedParent}
              setSelectedParent={setSelectedParent}
            />
          </Sider>
        )}

        {/* Mobile Sidebar in Drawer */}
        {isMobile && (
          <Drawer
            placement="left"
            closable
            onClose={() => setCollapsed(false)}
            open={collapsed}
            width="100%"
            bodyStyle={{
              padding: 0,
              backgroundColor: theme === "dark" ? "#001529" : sidebarBgColor,
            }}
          >
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              menuItems={menuItemsToUse}
              selectedParent={selectedParent}
              setSelectedParent={setSelectedParent}
            />
          </Drawer>
        )}

        <Layout
          className="transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isMobile
              ? 0
              : selectedParent
                ? collapsed
                  ? 250
                  : 460
                : collapsed
                  ? 80
                  : 260,
            transition: "margin-left 0.3s",
            backgroundColor: contentBgColor,
          }}
        >
          {/* Header (logo moved to header) */}
          <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />


          <Content
            style={{
              padding: "8px",
              backgroundColor: contentBgColor,
              minHeight: "calc(100vh - 112px)",
              overflow: "auto",
              position: "relative",
            }}
            onClick={handleContentClick}
          >
            <div
              className="rounded-2xl shadow-sm p-3 min-h-full transition-all duration-300 ease-in-out"
              style={{ backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff" }}
            >
              <Outlet />
            </div>
          </Content>
          <AppFooter
            theme={theme}
            bgColor={theme === "dark" ? "#001529" : footerBgColor}
          />
        </Layout>
      </Layout>

      {/* Theme Settings Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <SettingOutlined className="mr-2" />
            <span>Theme Settings</span>
          </div>
        }
        placement="right"
        closable
        onClose={closeSettings}
        open={settingsVisible}
        width={340}
        styles={{ body: { padding: "16px" } }}
        footer={
          <div className="flex justify-between">
            <Button onClick={resetTheme}>Reset to Default</Button>
            <Button type="primary" onClick={closeSettings}>
              Apply Changes
            </Button>
          </div>
        }
      >
        <Tabs defaultActiveKey="theme" centered>
          <TabPane tab="Theme" key="theme" className="px-2">
            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">Color Mode</h4>
              <Radio.Group
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                buttonStyle="solid"
                className="w-full flex"
              >
                <Radio.Button value="light" className="flex-1 text-center">
                  Light
                </Radio.Button>
                <Radio.Button value="dark" className="flex-1 text-center">
                  Dark
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* Common Color Schemes */}
            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">
                Common Color Schemes
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {commonColorSchemes.map((scheme, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                    onClick={() => applyCommonColorScheme(index)}
                  >
                    <div className="flex items-center">
                      <div className="flex">
                        <div
                          className="w-4 h-4 rounded-sm mr-1"
                          style={{ backgroundColor: scheme.headerBgColor }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded-sm mr-1"
                          style={{ backgroundColor: scheme.sidebarBgColor }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded-sm mr-1"
                          style={{ backgroundColor: scheme.contentBgColor }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded-sm mr-3"
                          style={{ backgroundColor: scheme.footerBgColor }}
                        ></div>
                      </div>
                      <span>{scheme.name}</span>
                    </div>
                    <CheckOutlined
                      className={`${headerBgColor === scheme.headerBgColor &&
                        sidebarBgColor === scheme.sidebarBgColor &&
                        contentBgColor === scheme.contentBgColor &&
                        footerBgColor === scheme.footerBgColor
                        ? "visible"
                        : "invisible"
                        }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Color Picker Section */}
            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">Custom Colors</h4>
              <div className="grid grid-cols-1 gap-3">
                {/* Primary Color */}
                <div
                  className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                  onClick={() => toggleColorPicker("primary")}
                >
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <span>Primary Color</span>
                  </div>
                  <BgColorsOutlined />
                </div>
                {activeColorPicker === "primary" && (
                  <div className="mt-2 mb-4">
                    <SketchPicker
                      color={primaryColor}
                      onChangeComplete={handlePrimaryColorChange}
                      width="100%"
                    />
                  </div>
                )}

                {/* Sidebar Color */}
                <div
                  className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                  onClick={() => toggleColorPicker("sidebar")}
                >
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: sidebarBgColor }}
                    ></div>
                    <span>Sidebar Color</span>
                  </div>
                  <BgColorsOutlined />
                </div>
                {activeColorPicker === "sidebar" && (
                  <div className="mt-2 mb-4">
                    <SketchPicker
                      color={sidebarBgColor}
                      onChangeComplete={(color) => setSidebarBgColor(color.hex)}
                      width="100%"
                    />
                  </div>
                )}

                {/* Footer Color */}
                <div
                  className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                  onClick={() => toggleColorPicker("footer")}
                >
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: footerBgColor }}
                    ></div>
                    <span>Footer Color</span>
                  </div>
                  <BgColorsOutlined />
                </div>
                {activeColorPicker === "footer" && (
                  <div className="mt-2 mb-4">
                    <SketchPicker
                      color={footerBgColor}
                      onChangeComplete={(color) => setFooterBgColor(color.hex)}
                      width="100%"
                    />
                  </div>
                )}

                {/* Content Background Color */}
                <div
                  className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                  onClick={() => toggleColorPicker("content")}
                >
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: contentBgColor }}
                    ></div>
                    <span>Content Background</span>
                  </div>
                  <BgColorsOutlined />
                </div>
                {activeColorPicker === "content" && (
                  <div className="mt-2 mb-4">
                    <SketchPicker
                      color={contentBgColor}
                      onChangeComplete={(color) => setContentBgColor(color.hex)}
                      width="100%"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabPane>

          <TabPane tab="Header" key="header" className="px-2">
            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">Header Gradient</h4>
              <div className="grid grid-cols-1 gap-3">
                <div
                  className="h-10 rounded cursor-pointer border hover:border-primary flex items-center justify-center"
                  style={{ background: createGradientFromColor(primaryColor) }}
                  onClick={() =>
                    handleGradientSelect(createGradientFromColor(primaryColor))
                  }
                >
                  <span className="text-white text-xs font-medium">
                    Primary Color Gradient
                  </span>
                  {headerGradient === createGradientFromColor(primaryColor) && (
                    <CheckOutlined className="ml-2 text-white" />
                  )}
                </div>

                {predefinedGradients.map((gradient, index) => (
                  <div
                    key={index}
                    className="h-10 rounded cursor-pointer border hover:border-primary flex items-center justify-center"
                    style={{ background: gradient.value }}
                    onClick={() => handleGradientSelect(gradient.value)}
                  >
                    <span className="text-white text-xs font-medium">
                      {gradient.name}
                    </span>
                    {headerGradient === gradient.value && (
                      <CheckOutlined className="ml-2 text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">
                Custom Header Gradient
              </h4>
              <div
                className="flex justify-between items-center p-3 border rounded hover:border-primary cursor-pointer"
                onClick={() => setActiveColorPicker(activeColorPicker ? null : "customGradient")}
              >
                <div className="flex items-center">
                  <div
                    className="w-6 h-6 rounded-full mr-3"
                    style={{ background: headerGradient }}
                  ></div>
                  <span>Custom Gradient</span>
                </div>
                <BgColorsOutlined />
              </div>

              {activeColorPicker && (
                <div className="mt-2 mb-4">
                  <div className="mb-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Pick gradient colors:
                    </p>
                    <div className="flex gap-4 items-center mb-2">
                      <input
                        type="color"
                        value={color1}
                        onChange={(e) => {
                          setColor1(e.target.value);
                          updateGradient(e.target.value, color2);
                        }}
                      />
                      <input
                        type="color"
                        value={color2}
                        onChange={(e) => {
                          setColor2(e.target.value);
                          updateGradient(color1, e.target.value);
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      Or enter full gradient string:
                    </p>
                    <input
                      type="text"
                      className="w-full p-2 border rounded mt-1"
                      value={headerGradient}
                      onChange={(e) => setHeaderGradient(e.target.value)}
                      placeholder="linear-gradient(to right, #color1, #color2)"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabPane>

          <TabPane tab="Layout" key="layout" className="px-2">
            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">Navigation Style</h4>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  hoverable
                  className={`text-center cursor-pointer ${!collapsed ? "border-primary" : ""}`}
                  onClick={() => setCollapsed(false)}
                >
                  <div className="flex h-20">
                    <div className="w-1/4 bg-gray-200 h-full"></div>
                    <div className="w-3/4 bg-gray-100 h-full"></div>
                  </div>
                  <div className="mt-2">Expanded</div>
                </Card>
                <Card
                  hoverable
                  className={`text-center cursor-pointer ${collapsed ? "border-primary" : ""}`}
                  onClick={() => setCollapsed(true)}
                >
                  <div className="flex h-20">
                    <div className="w-1/12 bg-gray-200 h-full"></div>
                    <div className="w-11/12 bg-gray-100 h-full"></div>
                  </div>
                  <div className="mt-2">Collapsed</div>
                </Card>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-3">Content Background</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "#f9fafb",
                  "#ffffff",
                  "#f0f2f5",
                  "#e6f7ff",
                  "#f6ffed",
                  "#fff7e6",
                ].map((color, i) => (
                  <Tooltip title={color} key={i}>
                    <div
                      className="h-10 rounded cursor-pointer border hover:border-primary flex items-center justify-center"
                      style={{ backgroundColor: color }}
                      onClick={() => setContentBgColor(color)}
                    >
                      {contentBgColor === color && <CheckOutlined />}
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Drawer>
    </ConfigProvider>
  );
};

export default MainLayout;
