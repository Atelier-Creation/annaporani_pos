import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Divider,
  Tabs,
  Space,
  Row,
  Col,
  message,
  Spin,
  Alert,
} from "antd";
import {
  SaveOutlined,
  UserOutlined,
  SecurityScanOutlined,
  LockOutlined,
  PrinterOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import userService from "../../user/service/userService";
import localPrintService from "../../billing/service/localPrintService";
import { defaultReceiptSettings, getReceiptSettings, saveReceiptSettings } from "../../billing/service/receiptSettings";

const { TabPane } = Tabs;

const Settings = () => {
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [receiptForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [printerName, setPrinterName] = useState(() => localStorage.getItem("thermalPrinterName") || "");
  const [localPrinters, setLocalPrinters] = useState([]);
  const [printServiceStatus, setPrintServiceStatus] = useState(null);
  const [printServiceLoading, setPrintServiceLoading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
    receiptForm.setFieldsValue(getReceiptSettings());
  }, []);

  const fetchUserData = async () => {
    try {
      setFetchingData(true);
      
      // Check if token exists
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      console.log('Fetching user profile data...');
      const response = await userService.getMe();
      console.log('Profile response:', response);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      console.log('User data:', data);
      
      setUserData(data);
      
      // Set profile form values
      const formValues = {
        username: data.username,
        email: data.email,
        phone: data.phone,
        role: data.role?.role_name || 'N/A',
      };
      
      console.log('Setting profile form values:', formValues);
      profileForm.setFieldsValue(formValues);
      console.log('Profile form values after set:', profileForm.getFieldsValue());
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      console.error('Error response:', error.response?.data);
      message.error('Failed to load user profile');
    } finally {
      setFetchingData(false);
    }
  };

  const handleProfileSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        email: values.email,
        phone: values.phone,
      };

      await userService.updateUser(userData.id, payload);
      
      message.success('Profile updated successfully');
      fetchUserData(); // Refresh user data
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (values) => {
    setLoading(true);
    try {
      await userService.changePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      message.success('Password changed successfully');
      securityForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const checkPrintService = async () => {
    setPrintServiceLoading(true);
    try {
      const status = await localPrintService.checkLocalPrintService();
      setPrintServiceStatus(status);
      message.success("Local print service is running");
    } catch (error) {
      console.error(error);
      setPrintServiceStatus(null);
      message.error("Local print service is not running");
    } finally {
      setPrintServiceLoading(false);
    }
  };

  const fetchLocalPrinters = async () => {
    setPrintServiceLoading(true);
    try {
      const printers = await localPrintService.findLocalPrinters();
      setLocalPrinters(printers);
      const defaultPrinter = printers.find((printer) => printer.default);
      if (!printerName && defaultPrinter) {
        setPrinterName(defaultPrinter.name);
        localStorage.setItem("thermalPrinterName", defaultPrinter.name);
      }
      message.success("Printers loaded");
    } catch (error) {
      console.error(error);
      message.error(error.message || "Failed to load local printers");
    } finally {
      setPrintServiceLoading(false);
    }
  };

  const savePrinterName = () => {
    localStorage.setItem("thermalPrinterName", printerName.trim());
    message.success("Printer saved for this computer");
  };

  const handleReceiptSettingsSubmit = (values) => {
    saveReceiptSettings(values);
    message.success("Receipt header and footer saved");
  };

  const resetReceiptSettings = () => {
    saveReceiptSettings(defaultReceiptSettings);
    receiptForm.setFieldsValue(defaultReceiptSettings);
    message.success("Receipt settings reset");
  };

  const printTestReceipt = async () => {
    setPrintServiceLoading(true);
    try {
      await localPrintService.printReceiptLocally({
        receiptProfile: getReceiptSettings(),
        billing_no: "TEST-PRINT",
        billing_date: new Date().toISOString(),
        customer_name: "Test Customer",
        payment_method: "cash",
        items: [
          { product_name: "Printer Test", quantity: 1, unit_price: 1, total_price: 1 },
        ],
        subtotal_amount: 1,
        total_amount: 1,
        paid_amount: 1,
      }, printerName.trim());
      message.success("Test receipt sent");
    } catch (error) {
      console.error(error);
      message.error(error.message || "Test print failed");
    } finally {
      setPrintServiceLoading(false);
    }
  };

  const downloadInstallerCommand = () => {
    const selectedPrinter = printerName || "80mm Series Printer";
    const script = `# DUCH Local Print Service installer\n# Run this from the extracted local-print-service folder.\n\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\install-startup-shortcut.ps1 -PrinterName "${selectedPrinter}"\n\n# For Scheduled Task mode, run PowerShell as Administrator:\n# powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\install-windows-task.ps1 -PrinterName "${selectedPrinter}"\n`;
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "duch-local-print-install.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card variant={"borderless"}>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
          <TabPane
            tab={
              <span>
                <UserOutlined /> Profile
              </span>
            }
            key="profile"
          >
            <Spin spinning={fetchingData}>
              {/* <div className="mb-6 flex justify-center">
                <Space direction="vertical" align="center">
                  <Avatar size={100} icon={<UserOutlined />} src={avatarUrl} />
                  <Upload
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleAvatarChange}
                  >
                    <Button icon={<UploadOutlined />}>Change Avatar</Button>
                  </Upload>
                </Space>
              </div> */}

              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      label="Username"
                      rules={[
                        { required: true, message: 'Please enter your username' },
                        { min: 3, message: 'Username must be at least 3 characters' }
                      ]}
                    >
                      <Input placeholder="Username" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                    >
                      <Input placeholder="Email" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                      { required: true, message: 'Please enter your phone number' },
                      { pattern: /^\d{10}$/, message: 'Phone must be 10 digits' }
                    ]}
                  >
                    <Input placeholder="Phone Number" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="role"
                    label="Role"
                  >
                    <Input disabled placeholder="Role" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
            </Spin>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SecurityScanOutlined /> Security
              </span>
            }
            key="security"
          >
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySubmit}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your current password",
                  },
                ]}
              >
                <Input.Password placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: "Please enter your new password" },
                  { min: 6, message: "Password must be at least 6 characters" }
                ]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Divider />

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={loading}
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane
            tab={
              <span>
                <PrinterOutlined /> Printer
              </span>
            }
            key="printer"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Alert
                type={printServiceStatus ? "success" : "info"}
                showIcon
                message={printServiceStatus ? "Local print service is running" : "Configure local thermal printing"}
                description={
                  printServiceStatus
                    ? `Connected to ${printServiceStatus.service}. Default printer: ${printServiceStatus.default_printer || "Not set"}`
                    : "Install and run DUCH Local Print Service on each cashier computer. The web app prints to http://127.0.0.1:9123."
                }
              />

              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form layout="vertical">
                    <Form.Item label="Thermal Printer Name">
                      <Input
                        list="settings-local-printers"
                        value={printerName}
                        onChange={(event) => setPrinterName(event.target.value)}
                        placeholder="80mm Series Printer"
                      />
                      <datalist id="settings-local-printers">
                        {localPrinters.map((printer) => (
                          <option key={printer.name} value={printer.name} />
                        ))}
                      </datalist>
                    </Form.Item>
                  </Form>
                </Col>
              </Row>

              <Space wrap>
                <Button loading={printServiceLoading} icon={<ReloadOutlined />} onClick={checkPrintService}>
                  Check Service
                </Button>
                <Button loading={printServiceLoading} onClick={fetchLocalPrinters}>
                  Find Local Printers
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={savePrinterName}>
                  Save Printer
                </Button>
                <Button loading={printServiceLoading} icon={<PrinterOutlined />} onClick={printTestReceipt}>
                  Print Test
                </Button>
                <Button icon={<DownloadOutlined />} onClick={downloadInstallerCommand}>
                  Download Install Command
                </Button>
              </Space>

              <Divider />

              <Form
                form={receiptForm}
                layout="vertical"
                onFinish={handleReceiptSettingsSubmit}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Store Name" name="storeName">
                      <Input placeholder="ANNAPOORANI" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Bill Title" name="billTitle">
                      <Input placeholder="CUSTOMER COPY" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Instagram ID" name="instagram">
                      <Input placeholder="annapoorani_sweets" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="GST Number" name="gstin">
                      <Input placeholder="33AYDPV1722F1ZO" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Cell Number 1" name="cell1">
                      <Input placeholder="7010668139" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Cell Number 2" name="cell2">
                      <Input placeholder="89764718464" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Footer Title" name="footerTitle">
                  <Input placeholder="Terms & Conditions:" />
                </Form.Item>

                <Form.Item label="Footer Terms" name="footerTerms">
                  <Input.TextArea rows={5} placeholder="One term per line" />
                </Form.Item>

                <Space wrap>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Save Header/Footer
                  </Button>
                  <Button onClick={resetReceiptSettings}>
                    Reset Header/Footer
                  </Button>
                </Space>
              </Form>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;


