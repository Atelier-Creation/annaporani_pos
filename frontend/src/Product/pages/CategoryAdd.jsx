// CategoryForm.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Spin,
  Avatar,
  Typography,
  Divider,
  Space,
  Tooltip,
  Result,
} from "antd";
import { CheckCircleTwoTone, EditOutlined, ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import categoryService from "../services/categoryService";

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Polished CategoryForm
 * - Responsive two-column layout on wide screens
 * - Gradient header with avatar/icon
 * - Sticky action footer
 * - Validation & success handling (shows Result briefly)
 */
const CategoryForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [descCount, setDescCount] = useState(0);
const [messageApi, contextHolder] = message.useMessage();
  // Fetch category for edit
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await categoryService.getById(id);
        // If your service returns res.data, adjust accordingly. This assumes direct object.
        const data = res?.data ?? res ?? {};
        form.setFieldsValue({
          category_name: data.category_name ?? "",
          description: data.description ?? "",
        });
        setDescCount((data.description || "").length);
      } catch (err) {
        console.error(err);
        message.error("Failed to fetch category");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Submit handler
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        category_name: values.category_name.trim(),
        description: values.description?.trim() || "",
      };

      if (id) {
        await categoryService.update(id, payload);
        messageApi.success("Category updated successfully");
      } else {
        await categoryService.create(payload);
        messageApi.success("Category added successfully");
      }

      // show success Result briefly before redirecting
      setSaved(true);
      setTimeout(() => {
        navigate("/Product/categories");
      }, 1100);
    } catch (err) {
      console.error("Error details:", err?.response?.data ?? err?.message ?? err);
      // try to surface structured server errors
      const serverData = err?.response?.data;
      if (serverData && serverData?.error && Array.isArray(serverData.error)) {
        serverData.error.forEach((e) => messageApi.error(e.message || JSON.stringify(e)));
      } else {
        messageApi.error("Operation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel/back
  const onCancel = () => navigate("/Product/categories");

  // Character counter for description
  const onDescriptionChange = (e) => {
    const value = e.target.value;
    setDescCount(value.length);
    // Update form field value
    form.setFieldValue('description', value);
  };

  // if (saved) {
  //   return (
  //     <div style={{ padding: 20, display: "flex", justifyContent: "center" }}>
  //       <Card style={{ width: 680, textAlign: "center", borderRadius: 12, boxShadow: "0 8px 30px rgba(2,6,23,0.08)" }}>
  //         <Result
  //           icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
  //           title={id ? "Category updated" : "Category created"}
  //           subTitle="Redirecting to category list..."
  //         />
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <>
    {contextHolder}
    <div style={{ padding: 10, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(2,6,23,0.08)",
            overflow: "hidden",
            transition: "transform .18s ease",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
            <div
              style={{
                background: "linear-gradient(135deg,#6EE7B7 0%, #3B82F6 100%)",
                width: 64,
                height: 64,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(59,130,246,0.18)",
              }}
            >
              <Avatar shape="square" size={40} icon={<EditOutlined style={{ color: "white", fontSize: 20 }} />} />
            </div>

            <div style={{ flex: 1 }}>
              <Title level={4} style={{ margin: 0 }}>
                {id ? "Edit Category" : "Add Category"}
              </Title>
              <Text type="secondary">Create and manage categories for products — keep names short and descriptive.</Text>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Tooltip title="Go back to list">
                <Button onClick={onCancel} icon={<ArrowLeftOutlined />} />
              </Tooltip>
            </div>
          </div>

          <Divider style={{ marginTop: 12, marginBottom: 20 }} />

          <Spin spinning={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ category_name: "", description: "" }}
            >
              {/* two-column responsive grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 16,
                }}
              >
                {/* On wider screens make two columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                  }}
                >
                  <Form.Item
                    label={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Text strong style={{ margin: 0 }}>
                          Category Name
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          (required)
                        </Text>
                      </div>
                    }
                    name="category_name"
                    rules={[{ required: true, message: "Please enter category name" }]}
                  >
                    <Input
                      placeholder="e.g., Men's Clothing"
                      size="large"
                      autoFocus
                      aria-label="Category name"
                    />
                  </Form.Item>

                  <Form.Item label="Description" name="description">
                    <TextArea rows={6} placeholder="Write a short description (optional)" onChange={onDescriptionChange} />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {descCount} characters
                      </Text>
                    </div>
                  </Form.Item>
                </div>
              </div>

              {/* Sticky action bar */}
              <div
                style={{
                  position: "sticky",
                  bottom: 12,
                  marginTop: 8,
                  background: "transparent",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Tip: keep category names concise — they appear in many places.
                    </Text>
                  </Space>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={onCancel}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    // onClick={() => form.submit()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <span>{id ? "Update Category" : "Add Category"}</span>
                  </Button>
                </div>
              </div>
            </Form>
          </Spin>
        </Card>
      </div>
    </div>
    </>
  );
};

export default CategoryForm;
