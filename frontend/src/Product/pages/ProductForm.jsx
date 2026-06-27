// ProductForm.jsx - Dress Shop Product Form with DO Spaces Image Upload
import React, { useEffect, useState } from "react";
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Spin,
  Card,
  Row,
  Col,
  Divider,
  Grid,
  Upload,
  Progress,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CheckCircleTwoTone,
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import subcategoryService from "../services/subcategoryService";

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { useBreakpoint } = Grid;
const { Dragger } = Upload;

const STEP_COLORS = ["#FF7A7A", "#FFB86B", "#7BD389", "#6B9BD3"];

const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

/* ─── Image Uploader Component ─── */
const ProductImageUploader = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      message.error("Only JPG, PNG, WebP or GIF files allowed");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Image must be smaller than 5 MB");
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    onChange?.(localUrl);

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85));
      }, 200);

      const res = await productService.uploadImage(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const cdnUrl = res.data?.image_url;
      onChange?.(cdnUrl);
      message.success("Image uploaded successfully ✅");
    } catch (err) {
      message.error(err?.response?.data?.error || "Upload failed");
      onChange?.(undefined);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }

    return false; // prevent antd auto-upload
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <div>
      {value ? (
        /* ── Preview Mode ── */
        <div
          style={{
            position: "relative",
            border: "2px solid #e8e8e8",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={value}
            alt="Product"
            style={{
              width: "100%",
              maxHeight: 260,
              objectFit: "contain",
              padding: 8,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 6,
            }}
          >
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); window.open(value, "_blank"); }}
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              style={{ borderRadius: 6 }}
            >
              Remove
            </Button>
          </div>
          {/* Re-upload trigger */}
          <div style={{ padding: "8px 0", width: "100%" }}>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleFile}
              disabled={uploading}
            >
              <Button size="small" type="link" style={{ width: "100%" }}>
                Click to replace image
              </Button>
            </Upload>
          </div>
        </div>
      ) : (
        /* ── Upload Mode ── */
        <Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleFile}
          disabled={uploading}
          style={{
            borderRadius: 12,
            border: `2px dashed ${dragOver ? "#4096ff" : "#d9d9d9"}`,
            background: dragOver ? "#f0f5ff" : "#fafafa",
            padding: "24px 16px",
            transition: "all 0.2s",
          }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
        >
          <p style={{ fontSize: 40, color: "#40a9ff", marginBottom: 8 }}>
            <InboxOutlined />
          </p>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>
            Click or drag image here
          </p>
          <p style={{ color: "#999", fontSize: 12, margin: "4px 0 0" }}>
            JPG, PNG, WebP, GIF — max 5 MB
          </p>
        </Dragger>
      )}

      {uploading && (
        <div style={{ marginTop: 8 }}>
          <Progress
            percent={uploadProgress}
            status={uploadProgress < 100 ? "active" : "success"}
            strokeColor={{ from: "#108ee9", to: "#87d068" }}
            size="small"
          />
          <p style={{ color: "#888", fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>
            Uploading to DigitalOcean Spaces…
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Main ProductForm ─── */
const ProductForm = () => {
  const screens = useBreakpoint();
  const { id: routeId } = useParams() || {};
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAll();
      const result = res.data;
      const categoriesArray = result.data || [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch (err) {
      console.error("Category fetch error:", err);
      message.error("Failed to fetch categories");
    }
  };

  // Fetch subcategories for category
  const handleCategoryChange = async (categoryId) => {
    form.setFieldsValue({ sub_category_id: undefined });
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      const res = await subcategoryService.getByCategory(categoryId);
      const result = res.data;
      const subcategoriesArray = result.data || [];
      setSubcategories(Array.isArray(subcategoriesArray) ? subcategoriesArray : []);
    } catch (err) {
      console.error("Subcategory fetch error:", err);
      message.error("Failed to fetch subcategories");
    }
  };

  // Fetch existing product when editing
  const fetchProduct = async (productId) => {
    if (!productId) return;
    setLoading(true);
    try {
      const response = await productService.getById(productId);
      const data = response.data || response;

      if (data?.category_id) await handleCategoryChange(data.category_id);

      form.setFieldsValue({
        product_name: data.product_name,
        category_id: data.category_id,
        sub_category_id: data.sub_category_id,
        brand: data.brand,
        portion_size: data.portion_size,
        dietary_preference: data.dietary_preference || "Veg",
        shelf_life: data.shelf_life,
        allergen_info: data.allergen_info,
        temperature: data.temperature,
        preparation_time: data.preparation_time,
        unit: data.unit,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        mrp: data.mrp,
        discount_percentage: data.discount_percentage,
        tax_percentage: data.tax_percentage,
        description: data.description,
        care_instructions: data.care_instructions,
        barcode: data.barcode,
        sku: data.sku,
        image_url: data.image_url,
        status: data.status || "active",
      });
    } catch (err) {
      console.error("Product fetch error:", err);
      message.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (routeId) fetchProduct(routeId);
  }, [routeId]);

  // Validation groups for steps
  const stepFieldMap = [
    ["category_id", "product_name"],
    ["portion_size", "dietary_preference"],
    ["purchase_price", "selling_price", "mrp", "discount_percentage", "tax_percentage"],
    ["description", "care_instructions", "status"],
  ];

  const next = async () => {
    try {
      const fields = stepFieldMap[current] || [];
      if (fields.length) await form.validateFields(fields);
      setCurrent((c) => Math.min(c + 1, STEP_COLORS.length - 1));
    } catch (err) {
      console.log("Validation failed for step", current, err);
    }
  };

  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  // Build payload from form
  const buildPayloadFromForm = () => {
    const values = form.getFieldsValue(true);
    const trim = (v) => (typeof v === "string" ? v.trim() : v);
    const toNumber = (v) => {
      if (v === null || v === undefined || v === "") return undefined;
      const num = Number(v);
      return isNaN(num) ? undefined : num;
    };

    const payload = {
      product_name: trim(values.product_name ?? ""),
      category_id: values.category_id != null ? String(values.category_id) : "",
      sub_category_id: values.sub_category_id != null ? String(values.sub_category_id) : undefined,
      brand: trim(values.brand ?? "") || undefined,
      portion_size: trim(values.portion_size ?? "") || undefined,
      dietary_preference: values.dietary_preference || undefined,
      shelf_life: trim(values.shelf_life ?? "") || undefined,
      allergen_info: trim(values.allergen_info ?? "") || undefined,
      temperature: values.temperature || undefined,
      preparation_time: trim(values.preparation_time ?? "") || undefined,
      unit: trim(values.unit ?? "piece"),
      purchase_price: toNumber(values.purchase_price) ?? 0,
      selling_price: toNumber(values.selling_price) ?? 0,
      mrp: toNumber(values.mrp),
      discount_percentage: toNumber(values.discount_percentage) ?? 0,
      tax_percentage: toNumber(values.tax_percentage) ?? 0,
      description: trim(values.description ?? "") || undefined,
      care_instructions: trim(values.care_instructions ?? "") || undefined,
      barcode: trim(values.barcode ?? "") || undefined,
      sku: trim(values.sku ?? "") || undefined,
      image_url: trim(values.image_url ?? "") || undefined,
      status: trim(values.status ?? "active"),
    };

    return payload;
  };

  // Map backend validation to form fields
  const applyServerValidationToForm = (errorArray) => {
    if (!Array.isArray(errorArray)) return;
    const fieldErrors = errorArray
      .map((e) => {
        const name = Array.isArray(e.path) ? e.path : (e.path ? [e.path] : [""]);
        return { name, errors: [e.message || "Invalid value"] };
      })
      .filter(Boolean);
    if (fieldErrors.length) form.setFields(fieldErrors);
  };

  // Final submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await form.validateFields();
      const payload = buildPayloadFromForm();

      // Client-side validation
      const clientFieldErrors = [];
      if (!payload.product_name || payload.product_name.length === 0) {
        clientFieldErrors.push({ name: ["product_name"], errors: ["Product name is required"] });
      }
      if (!payload.category_id || payload.category_id.length === 0) {
        clientFieldErrors.push({ name: ["category_id"], errors: ["Please select category"] });
      }

      if (clientFieldErrors.length) {
        form.setFields(clientFieldErrors);
        setLoading(false);
        setCurrent(0);
        return;
      }

      if (routeId) {
        await productService.update(routeId, payload);
        messageApi.success("Product updated successfully");
      } else {
        await productService.create(payload);
        messageApi.success("Product created successfully");
      }

      navigate("/Product/list");
    } catch (err) {
      console.error("Save error:", err);
      const resp = err?.response?.data;
      if (resp?.error && Array.isArray(resp.error)) {
        applyServerValidationToForm(resp.error);
        resp.error.forEach((e) => messageApi.error(e.message || JSON.stringify(e)));
      } else if (err?.message) {
        messageApi.error(err.message);
      } else {
        messageApi.error("Failed to save product");
      }
    } finally {
      setLoading(false);
    }
  };

  const optionValue = (cat) => {
    if (!cat) return "";
    return String(cat.uuid ?? cat._id ?? cat.id ?? "");
  };

  const StepIcon = ({ index, title }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: STEP_COLORS[index],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
        }}
      >
        {index + 1}
      </div>
      <div style={{ fontWeight: 700 }}>{title}</div>
    </div>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Basic Info
        return (
          <Card title="Basic Information" bordered={false}>
            <Form.Item
              label="Product Name"
              name="product_name"
              rules={[{ required: true, message: "Please enter product name" }]}
            >
              <Input placeholder="Enter product name" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Category"
                  name="category_id"
                  rules={[{ required: true, message: "Please select category" }]}
                >
                  <Select
                    placeholder="Select category"
                    onChange={handleCategoryChange}
                    allowClear
                    showSearch
                    size="large"
                    optionFilterProp="children"
                  >
                    {categories.map((cat) => (
                      <Option key={optionValue(cat)} value={optionValue(cat)}>
                        {cat.category_name || cat.name || "Unnamed"}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Subcategory" name="sub_category_id">
                  <Select
                    placeholder="Select subcategory (optional)"
                    allowClear
                    showSearch
                    size="large"
                    optionFilterProp="children"
                  >
                    {subcategories.map((sub) => (
                      <Option key={optionValue(sub)} value={optionValue(sub)}>
                        {sub.subcategory_name || sub.name || "Unnamed"}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Brand" name="brand">
                  <Input placeholder="Enter brand name" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Unit" name="unit">
                  <Input placeholder="piece, kg, meter" defaultValue="piece" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case 1:
        // Step 2: Sweet/Snack Shop Attributes
        return (
          <Card title="Sweet & Snack Attributes" bordered={false}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Portion Size" name="portion_size">
                  <Input placeholder="e.g., 250g, 500g, 1kg, 1 cup, 1 piece" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Dietary Preference" name="dietary_preference">
                  <Select placeholder="Select preference" allowClear size="large">
                    <Option value="Veg">Veg</Option>
                    <Option value="Non-Veg">Non-Veg</Option>
                    <Option value="Vegan">Vegan</Option>
                    <Option value="Eggless">Eggless</Option>
                    <Option value="Sugar-Free">Sugar-Free</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Shelf Life" name="shelf_life">
                  <Input placeholder="e.g., 2 days, 1 week, 1 month" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Temperature" name="temperature">
                  <Select placeholder="Select serving temp" allowClear size="large">
                    <Option value="Hot">Hot</Option>
                    <Option value="Cold">Cold</Option>
                    <Option value="Room Temperature">Room Temperature</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Preparation Time" name="preparation_time">
                  <Input placeholder="e.g., 10 mins, Instant" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Allergen Info" name="allergen_info">
                  <Input placeholder="e.g., Contains Nuts, Dairy, Gluten" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case 2:
        // Step 3: Pricing + Image
        return (
          <Card title="Pricing & Image" bordered={false}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Purchase Price"
                  name="purchase_price"
                  rules={[{ required: true, message: "Please enter purchase price" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0.00"
                    min={0}
                    precision={2}
                    prefix="₹"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Selling Price"
                  name="selling_price"
                  rules={[{ required: true, message: "Please enter selling price" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0.00"
                    min={0}
                    precision={2}
                    prefix="₹"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item label="MRP" name="mrp">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0.00"
                    min={0}
                    precision={2}
                    prefix="₹"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Discount %" name="discount_percentage">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0"
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Tax %" name="tax_percentage">
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0"
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Barcode" name="barcode">
                  <Input placeholder="Enter barcode" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="SKU" name="sku">
                  <Input placeholder="Enter SKU" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ fontWeight: 600 }}>
              📸 Product Image
            </Divider>

            {/* ── Image Upload ── */}
            <Form.Item
              name="image_url"
              label={null}
              style={{ marginBottom: 0 }}
            >
              <ProductImageUploader />
            </Form.Item>
          </Card>
        );

      case 3:
        // Step 4: Additional Details
        return (
          <Card title="Additional Details" bordered={false}>
            <Form.Item label="Description" name="description">
              <TextArea rows={4} placeholder="Enter product description" />
            </Form.Item>

            <Form.Item label="Care Instructions" name="care_instructions">
              <TextArea rows={3} placeholder="e.g., Hand wash only, Do not bleach" />
            </Form.Item>

            <Form.Item label="Status" name="status">
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="out_of_stock">Out of Stock</Option>
              </Select>
            </Form.Item>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 12, background: "#f0f2f5", minHeight: "100vh" }}>
      {contextHolder}
      <Spin spinning={loading}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Card>
            <Row gutter={24}>
              <Col xs={24} md={6}>
                <Steps direction={screens.md ? "vertical" : "horizontal"} current={current} onChange={(idx) => setCurrent(idx)} className="mb-6 md:mb-0">
                  <Step title={<StepIcon index={0} title="Basic" />} description={screens.md ? "Product info" : ""} />
                  <Step title={<StepIcon index={1} title="Attributes" />} description={screens.md ? "Dress details" : ""} />
                  <Step title={<StepIcon index={2} title="Pricing" />} description={screens.md ? "Price & image" : ""} />
                  <Step title={<StepIcon index={3} title="Details" />} description={screens.md ? "Description" : ""} />
                </Steps>
              </Col>

              <Col xs={24} md={18}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>{routeId ? "Edit Product" : "Add Product"}</h2>
                  <div style={{ color: "#666", fontSize: 13 }}>
                    Step {current + 1} of {STEP_COLORS.length}
                  </div>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    status: "active",
                    purchase_price: 0,
                    selling_price: 0,
                    discount_percentage: 0,
                    tax_percentage: 0,
                    unit: "piece",
                    gender: "Women",
                  }}
                >
                  {renderStepContent(current)}
                </Form>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    {current > 0 && (
                      <Button icon={<LeftOutlined />} onClick={prev}>
                        Back
                      </Button>
                    )}
                  </div>

                  <div>
                    {current < STEP_COLORS.length - 1 && (
                      <Button type="primary" onClick={next} icon={<RightOutlined />}>
                        Next
                      </Button>
                    )}

                    {current === STEP_COLORS.length - 1 && (
                      <Button
                        type="primary"
                        onClick={handleSubmit}
                        icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                        loading={loading}
                      >
                        {routeId ? "Update Product" : "Create Product"}
                      </Button>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </Spin>
    </div>
  );
};

export default ProductForm;
