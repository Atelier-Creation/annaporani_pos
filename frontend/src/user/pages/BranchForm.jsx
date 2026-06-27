import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Space, Switch } from "antd";
import userService from "../service/userService";

const BranchForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    if (id) {
      fetchBranch();
    }
  }, [id]);

  const fetchBranch = async () => {
    setLoading(true);
    try {
      const response = await userService.getBranchById(id);
      const branch = response.data.data;
      
      // Map backend field names to frontend field names
      form.setFieldsValue({
        name: branch.branch_name,
        code: branch.branch_code,
        location: branch.city,
        contactNumber: branch.phone,
        email: branch.email,
        address: branch.address,
        isActive: branch.is_active,
      });
    } catch (error) {
      message.error("Failed to fetch branch");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Map frontend field names to backend field names
      const payload = {
        branch_name: values.name,
        branch_code: values.code,
        address: values.address,
        phone: values.contactNumber,
        city: values.location,
        is_active: values.isActive,
      };

      if (id) {
        await userService.updateBranch(id, payload);
        messageApi.success("Branch updated successfully");
      } else {
        await userService.createBranch(payload);
        messageApi.success("Branch created successfully");
      }
      navigate("/user/branches");
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {contextHolder}
    <div className="p-6">
      <Card title={id ? "Edit Branch" : "Add Branch"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ isActive: true }}
        >
          <Form.Item
            label="Branch Name"
            name="name"
            rules={[{ required: true, message: "Please enter branch name" }]}
          >
            <Input placeholder="e.g., Main Branch" />
          </Form.Item>

          <Form.Item
            label="Branch Code"
            name="code"
            rules={[{ required: true, message: "Please enter branch code" }]}
          >
            <Input placeholder="e.g., BR001" />
          </Form.Item>

          <Form.Item label="Location" name="location">
            <Input placeholder="Branch location" />
          </Form.Item>

          <Form.Item label="Contact Number" name="contactNumber">
            <Input placeholder="Contact number" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input type="email" placeholder="Branch email" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} placeholder="Full address" />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "Update" : "Create"}
              </Button>
              <Button onClick={() => navigate("/user/branches")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
};

export default BranchForm;
