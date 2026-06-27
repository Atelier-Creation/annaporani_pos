import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Space, Select } from "antd";
import customerService from "../service/customerService";

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomerById(id);
      const customerData = response.data.data;
      
      // Map backend field names to form field names
      form.setFieldsValue({
        name: customerData.customer_name,
        phone: customerData.customer_phone,
        email: customerData.customer_email,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        pincode: customerData.pincode,
        gender: customerData.gender,
        date_of_birth: customerData.date_of_birth,
        anniversary_date: customerData.anniversary_date,
        notes: customerData.notes,
        source: customerData.source,
      });
    } catch (error) {
      message.error("Failed to fetch customer");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Map form field names to backend field names
      const payload = {
        customer_name: values.name,
        customer_phone: values.phone,
        customer_email: values.email || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        pincode: values.pincode || null,
        gender: values.gender || null,
        date_of_birth: values.date_of_birth || null,
        anniversary_date: values.anniversary_date || null,
        notes: values.notes || null,
        source: values.source || null,
      };
      
      if (id) {
        await customerService.updateCustomer(id, payload);
        await messageApi.success("Customer updated successfully");
      } else {
        await customerService.createCustomer(payload);
        await messageApi.success("Customer created successfully");
      }
      navigate("/customer/list");
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
      <Card title={id ? "Edit Customer" : "Add Customer"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Customer name" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { required: true, message: "Please enter phone" },
              { pattern: /^[0-9]{10}$/, message: "Invalid phone number" },
            ]}
          >
            <Input placeholder="10-digit phone number" maxLength={10} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Invalid email" }]}
          >
            <Input placeholder="customer@example.com" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} placeholder="Customer address" />
          </Form.Item>

          <Form.Item label="Source" name="source">
            <Select placeholder="Select how they found us">
              <Select.Option value="Walk-in">Walk-in</Select.Option>
              <Select.Option value="Instagram">Instagram</Select.Option>
              <Select.Option value="Google Search">Google Search</Select.Option>
              <Select.Option value="Google Review">Google Review</Select.Option>
              <Select.Option value="Friend Ref">Friend Ref</Select.Option>
              <Select.Option value="Ads">Ads</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "Update" : "Create"}
              </Button>
              <Button onClick={() => navigate("/customer/list")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
};

export default CustomerForm;
