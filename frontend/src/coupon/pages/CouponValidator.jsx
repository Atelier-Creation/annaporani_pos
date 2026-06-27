import { useState } from "react";
import { Form, Input, Button, Card, message, Alert, Descriptions, Divider } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import couponService from "../service/couponService";

const CouponValidator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
const [messageApi, contextHolder] = message.useMessage();
  const onFinish = async (values) => {
    setLoading(true);
    setValidationResult(null);
    try {
      const response = await couponService.validateCoupon({
        coupon_code: values.couponCode,
        customer_phone: values.customerPhone,
        purchase_amount: parseFloat(values.purchaseAmount),
      });
      
      setValidationResult(response.data.data);
      
      if (response.data.data.valid) {
        messageApi.success("Coupon is valid!");
      } else {
        messageApi.warning(response.data.data.message);
      }
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Failed to validate coupon");
      setValidationResult({
        valid: false,
        message: error.response?.data?.message || "Validation failed"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {contextHolder}
    <div className="p-6">
      <Card title="Validate Coupon Code">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Coupon Code"
            name="couponCode"
            rules={[
              { required: true, message: "Please enter coupon code" },
              { pattern: /^REF[A-Z0-9]{7}$/, message: "Invalid coupon format (e.g., REFABC1234)" }
            ]}
          >
            <Input 
              placeholder="e.g., REFABC1234" 
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            label="Customer Phone"
            name="customerPhone"
            rules={[
              { required: true, message: "Please enter customer phone" },
              { pattern: /^[0-9]{10}$/, message: "Invalid phone number" }
            ]}
          >
            <Input placeholder="10-digit phone number" maxLength={10} />
          </Form.Item>

          <Form.Item
            label="Purchase Amount"
            name="purchaseAmount"
            rules={[
              { required: true, message: "Please enter purchase amount" },
              { 
                validator: (_, value) => {
                  if (value && parseFloat(value) <= 0) {
                    return Promise.reject("Amount must be greater than 0");
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              type="number" 
              prefix="₹" 
              placeholder="0.00"
              step="0.01"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Validate Coupon
            </Button>
          </Form.Item>
        </Form>

        {validationResult && (
          <>
            <Divider />
            <Alert
              message={validationResult.valid ? "Valid Coupon" : "Invalid Coupon"}
              description={validationResult.message}
              type={validationResult.valid ? "success" : "error"}
              icon={validationResult.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              showIcon
              className="mb-4"
            />

            {validationResult.valid && validationResult.discount && (
              <Card title="Discount Details" size="small" type="inner">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Discount Amount">
                    ₹{validationResult.discount.discountAmount?.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Final Amount">
                    ₹{validationResult.discount.finalAmount?.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Owner Reward Points">
                    {validationResult.discount.ownerRewardPoints || 0} points
                  </Descriptions.Item>
                  <Descriptions.Item label="User Reward Points">
                    {validationResult.discount.userRewardPoints || 0} points
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </Card>

      <Card title="How Coupons Work" className="mt-4" size="small">
        <ul className="list-disc pl-5 space-y-2">
          <li>Customers get a referral coupon when they make a purchase of ₹2000 or more</li>
          <li>Coupon becomes valid 24 hours after generation</li>
          <li>Coupon is valid for 30 days</li>
          <li>Customers cannot use their own coupons</li>
          <li>When someone uses a coupon:
            <ul className="list-circle pl-5 mt-1">
              <li>User gets 10% discount (max ₹200)</li>
              <li>Coupon owner gets 100 reward points</li>
              <li>Coupon user gets 50 reward points</li>
            </ul>
          </li>
          <li>Minimum purchase amount: ₹500</li>
        </ul>
      </Card>
    </div>
    </>
  );
};

export default CouponValidator;
