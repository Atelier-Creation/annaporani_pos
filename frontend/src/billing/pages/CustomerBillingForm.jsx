import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  DatePicker,
  message,
  Spin,
  Table,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  Modal,
} from "antd";
import BillingService from "../service/billingService";
import ProductService from "../../Product/services/productService";
import dayjs from "dayjs";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea, Search } = Input;

const CustomerBillingForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  // ✅ summary state
  const [summary, setSummary] = useState({ subtotal: 0, totalTax: 0, grandTotal: 0 });
  const [manualCode, setManualCode] = useState("");

  /** 🔹 Helper: Recalculate summary */
  const recalcSummary = (items = []) => {
    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const totalTax = items.reduce((sum, i) => sum + (i.tax_amount || 0), 0);
    const grandTotal = subtotal + totalTax;
    setSummary({ subtotal, totalTax, grandTotal });
  };

  /** 🔹 Scan / Add product by code */
  const handleProductCode = async (code) => {
    if (!code) return;
    try {
      const product = await ProductService.getByCode(code.trim());
      if (!product) return message.error("No product found");

      let items = form.getFieldValue("items") || [];
      const index = items.findIndex((i) => i.product_code === product.product_code);

      if (index >= 0) {
        // 🔹 Duplicate → ask before adding more
        Modal.confirm({
          title: "Duplicate Product",
          content: `This product already exists with quantity ${items[index].quantity}. Add one more?`,
          okText: "Yes",
          cancelText: "No",
          onOk: () => {
            items[index].quantity += 1;

            const tax = (
              (items[index].quantity *
                items[index].unit_price *
                items[index].tax_percentage) /
              100
            ).toFixed(2);
            const total = (
              items[index].quantity * items[index].unit_price + parseFloat(tax)
            ).toFixed(2);

            items[index].tax_amount = parseFloat(tax);
            items[index].total_price = parseFloat(total);

            form.setFieldsValue({ items });
            recalcSummary(items);
          },
        });
      } else {
        // 🔹 First time → add new item
        items.push({
          product_id: product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          quantity: 1,
          unit_price: product.selling_price || 0,
          tax_percentage: product.tax_percentage || 0,
        });

        // recalc tax + total
        items = items.map((item) => {
          const tax = (
            (item.quantity * item.unit_price * item.tax_percentage) /
            100
          ).toFixed(2);
          const total = (
            item.quantity * item.unit_price + parseFloat(tax)
          ).toFixed(2);
          return { ...item, tax_amount: parseFloat(tax), total_price: parseFloat(total) };
        });

        form.setFieldsValue({ items });
        recalcSummary(items);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch product");
    }
  };

  /** 🔹 Submit Billing */
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        type: "Customer Billing",
        customer_name: values.customer_name,
        billing_date: values.billing_date ? dayjs(values.billing_date).toDate() : new Date(),
        status: values.status || "pending",
        items: values.items || [],
        remarks: values.remarks,
      };
      const response = await BillingService.create(payload);
      const createdBill = response.data || response;
      const receiptUrl = createdBill.id
        ? `/billing/customer-copy/${createdBill.id}?print=1`
        : "/billing/customer-copy?print=1";
      messageApi.success("Billing created successfully");
      navigate(receiptUrl, {
        state: { billing: createdBill.id ? createdBill : payload, autoPrint: true },
      });
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to save billing");
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Table Columns */
  const columns = [
    { title: "Code", dataIndex: "product_code", responsive: ["sm"] },
    { title: "Name", dataIndex: "product_name" },
    {
      title: "Qty",
      render: (_, record, index) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => {
            const items = form.getFieldValue("items") || [];
            items[index].quantity = value;
            const tax = ((value * record.unit_price * record.tax_percentage) / 100).toFixed(2);
            const total = (value * record.unit_price + parseFloat(tax)).toFixed(2);
            items[index].tax_amount = parseFloat(tax);
            items[index].total_price = parseFloat(total);
            form.setFieldsValue({ items });
            recalcSummary(items);
          }}
          style={{ width: 70 }}
        />
      ),
    },
    { title: "Unit Price", dataIndex: "unit_price", render: (v) => `₹${v}` },
    { title: "Tax", dataIndex: "tax_amount", render: (v) => `₹${v}` },
    {
      title: "Total",
      dataIndex: "total_price",
      render: (v) => <Text strong style={{ color: "#1890ff" }}>₹{v}</Text>,
    },
    {
      title: "Remove",
      render: (_, __, index) => (
        <Button
          danger
          size="small"
          onClick={() => {
            const items = form.getFieldValue("items") || [];
            items.splice(index, 1);
            form.setFieldsValue({ items });
            recalcSummary(items);
          }}
        >
          X
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card
        style={{
          margin: "16px auto",
          maxWidth: 800,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Spin spinning={loading}>
          <Title level={4} style={{ textAlign: "center", marginBottom: 24 }}>
            Customer Billing
          </Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ status: "pending", billing_date: dayjs(), items: [] }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Customer Name"
                  name="customer_name"
                  rules={[{ required: true, message: "Enter customer name" }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Billing Date" name="billing_date">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Status" name="status">
                  <Select>
                    <Option value="pending">Pending</Option>
                    <Option value="paid">Paid</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Remarks" name="remarks">
                  <TextArea rows={2} placeholder="Any remarks?" />
                </Form.Item>
              </Col>
            </Row>

            {/* 🔹 Barcode Scanner */}
            <div
              style={{
                width: "100%",
                maxHeight: 220,
                overflow: "hidden",
                marginBottom: 16,
                border: "2px dashed #1890ff",
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <BarcodeScannerComponent
                width={200}
                height={200}
                facingMode="environment"
                onUpdate={(err, result) => {
                  if (result) handleProductCode(result.text);
                }}
              />
            </div>

            {/* 🔹 Manual Product Code Entry */}
            <Form.Item label="Enter Product Code (if not scanned)">
              <Search
                placeholder="Type product code and press Enter"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                enterButton="Add"
                onSearch={(value) => {
                  if (value) {
                    handleProductCode(value);
                    setManualCode("");
                  }
                }}
              />
            </Form.Item>

            {/* 🔹 Items Table */}
            <Form.List name="items">
              {() => {
                const items = form.getFieldValue("items") || [];
                return (
                  <>
                    <Table
                      dataSource={items}
                      columns={columns}
                      pagination={false}
                      rowKey={(r, idx) => idx}
                      size="small"
                      scroll={{ x: 600 }}
                      style={{ marginBottom: 16 }}
                    />
                    <Divider />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                      <Text strong className="text-base">
                        Subtotal: <Text type="success">₹{summary.subtotal.toFixed(2)}</Text>
                      </Text>
                      <Text strong className="text-base">
                        Total Tax: <Text type="warning">₹{summary.totalTax.toFixed(2)}</Text>
                      </Text>
                      <Text strong className="text-lg text-blue-500">
                        Grand Total: ₹{summary.grandTotal.toFixed(2)}
                      </Text>
                    </div>
                  </>
                );
              }}
            </Form.List>

            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Submit Billing
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </>
  );
};

export default CustomerBillingForm;
