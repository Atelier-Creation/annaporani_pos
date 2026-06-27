import React from "react";
import {
    Form,
    Input,
    Select,
    Row,
    Col,
    Upload,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const CompanyEdit = ({ onFinish }) => {
    const [form] = Form.useForm();

    const handleFormSubmit = (vals) => {
        onFinish(vals);
        form.resetFields();
    };

    return (


        <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSubmit}
            initialValues={{ status: "Active" }}
            className="w-full"
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="name"
                        label="Company Name"
                        rules={[
                            { required: true, message: "Please enter company name" },
                            {
                                max: 25,
                                message: "Company name cannot exceed 25 characters",
                            },
                        ]}
                    >
                        <Input placeholder="Enter company name" maxLength={25} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="short_name"
                        label="Short Name"
                        rules={[
                            { required: true, message: "Please enter short name" },
                            {
                                max: 10,
                                message: "Short name cannot exceed 10 characters",
                            },
                        ]}
                    >
                        <Input placeholder="Enter short name" maxLength={10} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="address_1"
                        label="Address Line 1"
                        rules={[{ required: true, message: "Please enter address" }]}
                    >
                        <Input.TextArea placeholder="Enter address line 1" rows={2} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item name="address_2" label="Address Line 2">
                        <Input.TextArea placeholder="Enter address line 2" rows={2} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="city"
                        label="City"
                        rules={[{ required: true, message: "Please select city" }]}
                    >
                        <Select
                            placeholder="Select city"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="city1">City 1</Option>
                            <Option value="city2">City 2</Option>
                            <Option value="city3">City 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="state"
                        label="State"
                        rules={[{ required: true, message: "Please select state" }]}
                    >
                        <Select
                            placeholder="Select state"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="state1">State 1</Option>
                            <Option value="state2">State 2</Option>
                            <Option value="state3">State 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="pincode"
                        label="Pincode"
                        rules={[
                            { required: true, message: "Please enter pincode" },
                            { max: 6, message: "Pincode cannot exceed 6 characters" },
                            {
                                pattern: /^\d{6}$/,
                                message: "Please enter a valid 6-digit pincode",
                            },
                        ]}
                    >
                        <Input placeholder="Enter pincode" maxLength={6} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="country"
                        label="Country"
                        rules={[{ required: true, message: "Please select country" }]}
                    >
                        <Select
                            placeholder="Select country"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="country1">Country 1</Option>
                            <Option value="country2">Country 2</Option>
                            <Option value="country3">Country 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[
                            { required: true, message: "Please enter phone number" },
                            {
                                max: 10,
                                message: "Phone number cannot exceed 10 characters",
                            },
                            {
                                pattern: /^\d{10}$/,
                                message: "Please enter a valid 10-digit phone number",
                            },
                        ]}
                    >
                        <Input placeholder="Enter phone number" maxLength={10} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter email" },
                            { type: "email", message: "Please enter a valid email" },
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="gst_no"
                        label="GST Number"
                        rules={[
                            { required: true, message: "Please enter GST number" },
                            {
                                pattern:
                                    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                                message: "Please enter a valid GST number",
                            },
                        ]}
                    >
                        <Input placeholder="Enter GST number" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={24}>
                    <Form.Item
                        name="logo"
                        label="Company Logo"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            if (Array.isArray(e)) {
                                return e;
                            }
                            return e && e.fileList;
                        }}
                    >
                        <Upload
                            listType="picture-card"
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <div className="border-t border-gray-200 my-4 pt-4">
                        <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                    </div>
                </Col>

                <Col xs={24} sm={12}>
                    <Form.Item
                        name="billing_address_line1"
                        label="Billing Address Line 1"
                        rules={[
                            { required: true, message: "Please enter billing address" },
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Enter billing address line 1"
                            rows={2}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="billing_address_line2"
                        label="Billing Address Line 2"
                    >
                        <Input.TextArea
                            placeholder="Enter billing address line 2"
                            rows={2}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="billing_city"
                        label="Billing City"
                        rules={[
                            { required: true, message: "Please select billing city" },
                        ]}
                    >
                        <Select
                            placeholder="Select billing city"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="city1">City 1</Option>
                            <Option value="city2">City 2</Option>
                            <Option value="city3">City 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="billing_state"
                        label="Billing State"
                        rules={[
                            { required: true, message: "Please select billing state" },
                        ]}
                    >
                        <Select
                            placeholder="Select billing state"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="state1">State 1</Option>
                            <Option value="state2">State 2</Option>
                            <Option value="state3">State 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="billing_pincode"
                        label="Billing Pincode"
                        rules={[
                            { required: true, message: "Please enter billing pincode" },
                            {
                                max: 6,
                                message: "Billing pincode cannot exceed 6 characters",
                            },
                            {
                                pattern: /^\d{6}$/,
                                message: "Please enter a valid 6-digit pincode",
                            },
                        ]}
                    >
                        <Input placeholder="Enter billing pincode" maxLength={6} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="billing_country"
                        label="Billing Country"
                        rules={[
                            { required: true, message: "Please select billing country" },
                        ]}
                    >
                        <Select
                            placeholder="Select billing country"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            <Option value="country1">Country 1</Option>
                            <Option value="country2">Country 2</Option>
                            <Option value="country3">Country 3</Option>
                        </Select>
                    </Form.Item>
                </Col>
                {/* Status field is commented out in the original code */}
            </Row>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                <Button
                    type="primary"
                    danger
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    className="w-full sm:w-auto"
                >
                    Update
                </Button>
            </div>
        </Form>
    );
};
export default CompanyEdit;