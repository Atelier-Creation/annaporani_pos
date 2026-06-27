import { useState } from "react";
import { Form, Input, Button, Card, Table, message, Tag, Space } from "antd";
import { SearchOutlined, CopyOutlined } from "@ant-design/icons";
import couponService from "../service/couponService";
import moment from "moment";

const CustomerCoupons = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [customerPhone, setCustomerPhone] = useState("");
const [messageApi, contextHolder] = message.useMessage();
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await couponService.getCustomerCoupons(values.phone);
      setCoupons(response.data.data || []);
      setCustomerPhone(values.phone);
      
      if (!response.data.data || response.data.data.length === 0) {
        messageApi.info("No coupons found for this customer");
      } else {
        messageApi.success(`Found ${response.data.data.length} coupon(s)`);
      }
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Failed to fetch coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    messageApi.success("Coupon code copied to clipboard!");
  };

  const columns = [
    {
      title: "Coupon Code",
      dataIndex: "coupon_code",
      key: "coupon_code",
      render: (code) => (
        <Space>
          <Tag color="blue" style={{ fontSize: 14, fontFamily: 'monospace' }}>
            {code}
          </Tag>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCoupon(code)}
          />
        </Space>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      render: (_, record) => (
        <span>
          {record.discount_value}% 
          {record.max_discount_amount && ` (max ₹${record.max_discount_amount})`}
        </span>
      ),
    },
    {
      title: "Min Purchase",
      dataIndex: "min_purchase_amount",
      key: "min_purchase_amount",
      render: (amount) => `₹${amount}`,
    },
    {
      title: "Valid From",
      dataIndex: "valid_from",
      key: "valid_from",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Valid Until",
      dataIndex: "valid_until",
      key: "valid_until",
      render: (date) => date ? moment(date).format("DD/MM/YYYY") : "No expiry",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const now = new Date();
        const validFrom = new Date(record.valid_from);
        const validUntil = record.valid_until ? new Date(record.valid_until) : null;

        if (record.is_used) {
          return <Tag color="default">Used</Tag>;
        }
        if (!record.is_active) {
          return <Tag color="red">Inactive</Tag>;
        }
        if (now < validFrom) {
          return <Tag color="orange">Pending</Tag>;
        }
        if (validUntil && now > validUntil) {
          return <Tag color="red">Expired</Tag>;
        }
        return <Tag color="green">Active</Tag>;
      },
    },
    {
      title: "Used At",
      dataIndex: "used_at",
      key: "used_at",
      render: (date) => date ? moment(date).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <>
    {contextHolder}
    <div className="p-6">
      <Card title="Search Customer Coupons">
        <Form
          form={form}
          layout="inline"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              { pattern: /^[0-9]{10}$/, message: "Invalid phone number" }
            ]}
          >
            <Input 
              placeholder="Enter 10-digit phone number" 
              maxLength={10}
              style={{ width: 250 }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SearchOutlined />}
            >
              Search
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {customerPhone && (
        <Card 
          title={`Coupons for ${customerPhone}`} 
          className="mt-4"
          extra={<Tag color="blue">{coupons.length} coupon(s)</Tag>}
        >
          <Table
            columns={columns}
            dataSource={coupons}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      <Card title="Coupon Information" className="mt-4" size="small">
        <div className="space-y-2">
          <p><strong>How to earn coupons:</strong></p>
          <ul className="list-disc pl-5">
            <li>Make a purchase of ₹2000 or more</li>
            <li>Receive a unique referral coupon code</li>
            <li>Coupon becomes active after 24 hours</li>
            <li>Valid for 30 days from generation</li>
          </ul>
          
          <p className="mt-4"><strong>Coupon Status:</strong></p>
          <ul className="list-disc pl-5">
            <li><Tag color="green">Active</Tag> - Can be used now</li>
            <li><Tag color="orange">Pending</Tag> - Will be active after 24 hours</li>
            <li><Tag color="default">Used</Tag> - Already redeemed</li>
            <li><Tag color="red">Expired</Tag> - Validity period ended</li>
            <li><Tag color="red">Inactive</Tag> - Deactivated by admin</li>
          </ul>
        </div>
      </Card>
    </div>
    </>
  );
};

export default CustomerCoupons;
