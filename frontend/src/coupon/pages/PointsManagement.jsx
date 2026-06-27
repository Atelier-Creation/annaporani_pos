import { useState } from "react";
import { Form, Input, Button, Card, Table, message, Tag, Statistic, Row, Col } from "antd";
import { SearchOutlined, TrophyOutlined, HistoryOutlined } from "@ant-design/icons";
import couponService from "../service/couponService";
import moment from "moment";

const PointsManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState(null);
  const [history, setHistory] = useState([]);
  const [customerPhone, setCustomerPhone] = useState("");
const [messageApi, contextHolder] = message.useMessage();
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const [pointsRes, historyRes] = await Promise.all([
        couponService.getCustomerPoints(values.phone),
        couponService.getPointsHistory(values.phone),
      ]);

      setPointsData(pointsRes.data.data);
      setHistory(historyRes.data.data || []);
      setCustomerPhone(values.phone);
      
      message.success("Points data loaded successfully");
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch points data");
      setPointsData(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Type",
      dataIndex: "transaction_type",
      key: "type",
      render: (type) => (
        <Tag color={type === "earned" ? "green" : "red"}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      render: (points, record) => (
        <span 
          className={record.transaction_type === "earned" ? "text-green-600" : "text-red-600"}
          style={{ fontWeight: 'bold' }}
        >
          {record.transaction_type === "earned" ? "+" : "-"}
          {points}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Reference",
      key: "reference",
      render: (_, record) => {
        if (record.billing_id) {
          return <Tag>Bill #{record.billing_id}</Tag>;
        }
        if (record.coupon_id) {
          return <Tag color="blue">Coupon #{record.coupon_id}</Tag>;
        }
        return "-";
      },
    },
  ];

  return (
    <div className="p-6">
      <Card title="Search Customer Points">
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

      {pointsData && (
        <>
          <Card title={`Points Summary for ${customerPhone}`} className="mt-4">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Points"
                  value={pointsData.total_points || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Points Earned"
                  value={pointsData.points_earned || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Points Redeemed"
                  value={pointsData.points_redeemed || 0}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>

          <Card 
            title={
              <span>
                <HistoryOutlined /> Points History
              </span>
            }
            className="mt-4"
            extra={<Tag color="blue">{history.length} transaction(s)</Tag>}
          >
            <Table
              columns={columns}
              dataSource={history}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      )}

      <Card title="Points System Information" className="mt-4" size="small">
        <div className="space-y-2">
          <p><strong>How to Earn Points:</strong></p>
          <ul className="list-disc pl-5">
            <li>When someone uses your referral coupon: <strong>100 points</strong></li>
            <li>When you use someone's referral coupon: <strong>50 points</strong></li>
            <li>Points are automatically credited after successful transaction</li>
          </ul>
          
          <p className="mt-4"><strong>Points Redemption:</strong></p>
          <ul className="list-disc pl-5">
            <li>Points can be redeemed for discounts on future purchases</li>
            <li>Redemption rules are configured by the administrator</li>
            <li>Check with staff for current redemption rates</li>
          </ul>

          <p className="mt-4"><strong>Transaction Types:</strong></p>
          <ul className="list-disc pl-5">
            <li><Tag color="green">EARNED</Tag> - Points added to account</li>
            <li><Tag color="red">REDEEMED</Tag> - Points used for discount</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default PointsManagement;
