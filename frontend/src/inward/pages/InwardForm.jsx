// src/inward/pages/InwardForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Card,
  Row,
  Col,
  Divider,
  Space,
  Typography,
  List,
  Badge,
  Alert,
} from "antd";
import inwardService from "../service/inwardService";
import productService from "../../Product/services/productService";
import { useBranch } from "../../context/BranchContext";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const InwardForm = () => {
  const { id } = useParams(); // future edit support
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { branches, selectedBranch } = useBranch();
  const [selectedFormBranch, setSelectedFormBranch] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  // Product dropdown states
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch all products for dropdown
  const fetchAllProducts = async (searchTerm = "") => {
    setProductsLoading(true);
    try {
      const params = {
        page: 1,
        limit: searchTerm ? 100 : 10, // Show more when searching
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await productService.getAll(params);
      const products = response.data?.data || response.data || [];
      setAllProducts(products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      message.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  // Load initial products on mount
  useEffect(() => {
    fetchAllProducts();
  }, []);
  
  // summary now stores items array plus totals and lastAdded index
  const [summary, setSummary] = useState({
    items: [],
    count: 0,
    qty: 0,
    value: 0,
    lastAddedIndex: -1,
  });

  // Check if "All" is selected and user needs to choose a branch
  const needsBranchSelection = selectedBranch?.id === 'all' && branches.length > 1;

  // Fetch inward for editing
  useEffect(() => {
    if (id) {
      fetchInward(id);
    }
  }, [id]);

  const fetchInward = async (inwardId) => {
    setLoading(true);
    try {
      const response = await inwardService.getById(inwardId);
      const data = response.data || response;
      
      // Map items to form structure
      const items = (data.items || []).map(item => ({
        product_id: item.product_id,
        product_code: item.product?.product_code || "",
        product_name: item.product?.product_name || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        unit: item.unit,
        size: item.size || "",
        color: item.color || "",
        expiry_date: item.expiry_date ? dayjs(item.expiry_date) : null,
        batch_number: item.batch_number || "",
        barcode: item.barcode || "",
      }));

      form.setFieldsValue({
        supplier_name: data.supplier_name,
        supplier_invoice: data.supplier_invoice,
        received_date: data.received_date ? dayjs(data.received_date) : null,
        status: data.status,
        items: items,
      });

      updateSummary(items, -1);
    } catch (err) {
      console.error("Fetch inward error:", err);
      message.error("Failed to load inward");
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Add product by code */
  const handleProductCode = async (e) => {
    const code = (e?.target?.value || "").trim();
    if (!code) return;
    e.target.value = ""; // reset input

    try {
      const response = await productService.getByCode(code);
      const product = response.data || response;

      if (!product) {
        messageApi.error("No product found with that code");
        return;
      }

      addProductToItems(product);
    } catch (err) {
      console.error("Fetch product error:", err);
      message.error("Failed to fetch product");
    }
  };

  /** 🔹 Add product from dropdown */
  const handleProductSelect = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      addProductToItems(product);
      setSelectedProduct(null); // Clear selection
    }
  };

  /** 🔹 Common function to add product to items */
  const addProductToItems = (product) => {
    let items = form.getFieldValue("items") || [];

    // check if product already exists
    const existingIndex = items.findIndex(
      (item) => item.product_code === product.product_code
    );

    if (existingIndex >= 0) {
      // increase quantity
      items[existingIndex].quantity += 1;
      items[existingIndex].total_price = items[existingIndex].quantity * items[existingIndex].unit_price;
      form.setFieldsValue({ items });
      updateSummary(items, existingIndex);
      messageApi.success(`${product.product_name} quantity increased`);
    } else {
      // add new row
      const unitPrice = product.purchase_price || 0;
      items.push({
        product_id: product.id,
        product_code: product.product_code,
        product_name: product.product_name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        unit: product.unit || "piece",
        size: product.size || "",
        color: product.color || "",
        expiry_date: null,
        batch_number: "",
        barcode: product.barcode || "",
      });
      form.setFieldsValue({ items });
      updateSummary(items, items.length - 1);
      messageApi.success(`${product.product_name} added`);
    }
  };

  /** 🔹 Submit Handler */
  const handleSubmit = async (values) => {
    // Check if branch is selected when "All" is active
    if (needsBranchSelection && !selectedFormBranch) {
      messageApi.error("Please select a branch for this inward entry");
      return;
    }
    
    setLoading(true);
    try {
      // Prepare items with proper field mapping - only include fields with values
      const items = (values.items || []).map(item => {
        const itemData = {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          unit: item.unit || "piece",
        };
        
        // Only add optional fields if they have values
        if (item.size) itemData.size = item.size;
        if (item.color) itemData.color = item.color;
        if (item.expiry_date) itemData.expiry_date = dayjs(item.expiry_date).toISOString();
        if (item.batch_number) itemData.batch_number = item.batch_number;
        if (item.barcode) itemData.barcode = item.barcode;
        
        return itemData;
      });

      const payload = {
        supplier_name: values.supplier_name,
        received_date: values.received_date
          ? dayjs(values.received_date).toISOString()
          : new Date().toISOString(),
        status: values.status || "pending",
        items: items,
      };
      
      // Add branch_id - use form selection if "All" is active, otherwise use context
      if (needsBranchSelection) {
        payload.branch_id = selectedFormBranch;
      } else if (selectedBranch?.id && selectedBranch.id !== 'all') {
        payload.branch_id = selectedBranch.id;
      }
      
      // Only add supplier_invoice if it has a value
      if (values.supplier_invoice) {
        payload.supplier_invoice = values.supplier_invoice;
      }

      console.log("=== SUBMITTING INWARD ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      if (id) {
        await inwardService.update(id, payload);
        messageApi.success("Inward entry updated successfully");
      } else {
        await inwardService.create(payload);
        messageApi.success("Inward entry created successfully");
      }
      
      navigate("/inward/list");
    } catch (err) {
      console.error("Save error:", err);
      const errorMsg = err?.response?.data?.error || err?.message || "Failed to save inward entry";
      messageApi.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // utility to compute summary from items array and optionally set lastAddedIndex
  const updateSummary = (items = [], lastAddedIndex = -1) => {
    let qty = 0;
    let value = 0;
    (items || []).forEach((it) => {
      const q = Number(it.quantity || 0);
      const p = Number(it.unit_price || 0);
      qty += q;
      value += q * p;
    });
    setSummary({
      items: items || [],
      count: (items || []).length,
      qty,
      value,
      lastAddedIndex,
    });
  };

  // Called whenever any form value changes — keeps right column live
  const onValuesChange = (_, allValues) => {
    const items = allValues.items || [];
    // lastAddedIndex remains -1 here because we only know additions via handleProductCode.
    // But if you want the last changed index, you'd need more logic; keeping -1 is safe.
    updateSummary(items, -1);
  };

  // initial summary load
  useEffect(() => {
    const items = form.getFieldValue("items") || [];
    updateSummary(items, -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      width: 120,
      fixed: "left",
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      width: 180,
    },
    {
      title: "Size",
      key: "size",
      width: 80,
      render: (_, record, index) => (
        <Form.Item name={[index, "size"]} style={{ margin: 0 }}>
          <Input placeholder="Size" />
        </Form.Item>
      ),
    },
    {
      title: "Color",
      key: "color",
      width: 100,
      render: (_, record, index) => (
        <Form.Item name={[index, "color"]} style={{ margin: 0 }}>
          <Input placeholder="Color" />
        </Form.Item>
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      width: 100,
      render: (_, record, index) => (
        <Form.Item
          name={[index, "quantity"]}
          rules={[{ required: true, message: "Enter qty" }]}
          style={{ margin: 0 }}
        >
          <InputNumber 
            min={1} 
            style={{ width: "100%" }}
            onChange={() => {
              // Recalculate total_price when quantity changes
              const items = form.getFieldValue("items") || [];
              if (items[index]) {
                items[index].total_price = items[index].quantity * items[index].unit_price;
                form.setFieldsValue({ items });
                updateSummary(items, -1);
              }
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Unit Price",
      key: "unit_price",
      width: 120,
      render: (_, record, index) => (
        <Form.Item
          name={[index, "unit_price"]}
          rules={[{ required: true, message: "Enter price" }]}
          style={{ margin: 0 }}
        >
          <InputNumber 
            min={0} 
            precision={2}
            style={{ width: "100%" }}
            onChange={() => {
              // Recalculate total_price when unit_price changes
              const items = form.getFieldValue("items") || [];
              if (items[index]) {
                items[index].total_price = items[index].quantity * items[index].unit_price;
                form.setFieldsValue({ items });
                updateSummary(items, -1);
              }
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Total",
      key: "total_price",
      width: 120,
      render: (_, record) => {
        const total = (record.quantity || 0) * (record.unit_price || 0);
        return <Text strong>₹{total.toFixed(2)}</Text>;
      },
    },
    {
      title: "Unit",
      key: "unit",
      width: 90,
      render: (_, record, index) => (
        <Form.Item name={[index, "unit"]} style={{ margin: 0 }}>
          <Input placeholder="piece" />
        </Form.Item>
      ),
    },
    {
      title: "Batch No",
      key: "batch_number",
      width: 120,
      render: (_, record, index) => (
        <Form.Item name={[index, "batch_number"]} style={{ margin: 0 }}>
          <Input placeholder="Batch" />
        </Form.Item>
      ),
    },
    {
      title: "Barcode",
      key: "barcode",
      width: 120,
      render: (_, record, index) => (
        <Form.Item name={[index, "barcode"]} style={{ margin: 0 }}>
          <Input placeholder="Barcode" />
        </Form.Item>
      ),
    },
    {
      title: "Expiry Date",
      key: "expiry_date",
      width: 140,
      render: (_, record, index) => (
        <Form.Item name={[index, "expiry_date"]} style={{ margin: 0 }}>
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, __, index) => (
        <Form.Item shouldUpdate style={{ margin: 0 }}>
          {() => (
            <Button
              danger
              size="small"
              onClick={() => {
                const items = form.getFieldValue("items") || [];
                items.splice(index, 1);
                form.setFieldsValue({ items });
                updateSummary(items, -1);
              }}
            >
              Remove
            </Button>
          )}
        </Form.Item>
      ),
    },
  ];

  return (
    <>
    {contextHolder}
    <div style={{ padding: 5 }}>
      <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            {id ? "Edit Inward" : "Add Inward"}
          </Title>
          <Text type="secondary">Create inward entries quickly using product codes</Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate("/inward/list")}>Back to list</Button>
          </Space>
        </Col>
      </Row>

      {needsBranchSelection && (
        <Alert
          message="Branch Selection Required"
          description="You are viewing all branches. Please select a specific branch for this inward entry."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={16}>
          {/* Left: form + table */}
          <Col xs={24} lg={16}>
            <Card bordered bodyStyle={{ padding: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ status: "pending", items: [] }}
                onValuesChange={onValuesChange}
              >
                <Row gutter={12}>
                  {needsBranchSelection && (
                    <Col xs={24}>
                      <Form.Item
                        label="Select Branch"
                        required
                        help="Choose which branch this inward belongs to"
                      >
                        <Select
                          placeholder="Select a branch"
                          value={selectedFormBranch}
                          onChange={setSelectedFormBranch}
                          style={{ width: "100%" }}
                        >
                          {branches.map((branch) => (
                            <Option key={branch.branch_id} value={branch.branch_id}>
                              {branch.branch?.branch_name || branch.branch?.name} ({branch.branch?.branch_code || branch.branch?.code})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  )}
                  
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Supplier Name"
                      name="supplier_name"
                      rules={[{ required: true, message: "Please enter supplier name" }]}
                    >
                      <Input placeholder="Enter supplier name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item label="Supplier Invoice" name="supplier_invoice">
                      <Input placeholder="Enter supplier invoice number (optional)" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Received Date"
                      name="received_date"
                      rules={[{ required: true, message: "Please select date" }]}
                    >
                      <DatePicker style={{ width: "100%" }} showTime />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item label="Status" name="status">
                      <Select>
                        <Option value="pending">Pending</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item label="Select Product">
                      <Select
                        showSearch
                        placeholder="Search and select product"
                        value={selectedProduct}
                        onChange={handleProductSelect}
                        onSearch={(value) => {
                          if (value.length >= 2) {
                            fetchAllProducts(value);
                          } else if (value.length === 0) {
                            fetchAllProducts();
                          }
                        }}
                        loading={productsLoading}
                        filterOption={false}
                        notFoundContent={productsLoading ? <Spin size="small" /> : "No products found"}
                        style={{ width: "100%" }}
                      >
                        {allProducts.map((product) => (
                          <Option key={product.id} value={product.id}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>
                                {product.product_name} ({product.product_code})
                              </span>
                              <span style={{ color: "#52c41a", fontWeight: 600 }}>
                                ₹{product.purchase_price || product.selling_price}
                              </span>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Divider style={{ margin: "8px 0 16px 0" }} />
                    <Form.List name="items">
                      {(fields, { remove }) => {
                        const items = form.getFieldValue("items") || [];
                        return (
                          <Table
                            dataSource={items}
                            columns={columns}
                            pagination={false}
                            rowKey={(record, idx) => idx}
                            size="small"
                            scroll={{ x: 1400 }}
                          />
                        );
                      }}
                    </Form.List>
                  </Col>

                  <Col xs={24} style={{ marginTop: 16 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        {id ? "Update Inward" : "Add Inward"}
                      </Button>
                      <Button onClick={() => navigate("/inward/list")}>Cancel</Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>

          {/* Right: dynamic visual summary */}
          <Col xs={24} lg={8}>
            <Card bordered size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text type="secondary">Items</Text>
                  <div style={{ marginTop: 8 }}>
                    <Title level={3} style={{ margin: 0 }}>
                      {summary.count}
                    </Title>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text type="secondary">Total Qty</Text>
                  <div>
                    <Text strong>{summary.qty}</Text>
                  </div>
                  <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                    Total Value
                  </Text>
                  <div>
                    <Text strong>{summary.value.toFixed(2)}</Text>
                  </div>
                </div>
              </div>

              <Divider />

              <Text type="secondary">Recent items</Text>
              <div style={{ marginTop: 8 }}>
                <List
                  size="small"
                  dataSource={summary.items.slice().reverse().slice(0, 6)} // show up to 6 recent
                  renderItem={(item, idx) => {
                    // compute original index to detect last added if needed
                    const originalIndex = summary.items.length - 1 - idx;
                    const isLast = originalIndex === summary.lastAddedIndex;
                    return (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                              <div>
                                {isLast ? <Badge status="success" text={item.product_name || item.product_code} /> : (item.product_name || item.product_code)}
                              </div>
                              <div style={{ minWidth: 110, textAlign: "right" }}>
                                <Text>{(item.quantity || 0)} × {(item.unit_price || 0).toFixed ? (item.unit_price || 0).toFixed(2) : item.unit_price}</Text>
                              </div>
                            </div>
                          }
                          description={item.product_code ? <Text type="secondary">{item.product_code}</Text> : null}
                        />
                      </List.Item>
                    );
                  }}
                />
                {summary.items.length === 0 && <Text type="secondary">No items added yet</Text>}
              </div>
            </Card>

            <Card bordered size="small">
              <Text type="secondary">Guidance</Text>
              <div style={{ marginTop: 8 }}>
                <Text>
                  Use the scan field to add products quickly. The summary and recent list update live.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
    </>
  );
};

export default InwardForm;
