import React, { useState } from 'react';
import { Form, Card, Button, Input, Select, message } from 'antd';
import { callLinkAIAPI, extractJSONFromText } from '../utils/apiService';

const { TextArea } = Input;
const { Option } = Select;

const MedicalRecordParser = ({ initialData, onSave, loading }) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(!initialData);

  // 设置初始表单值
  React.useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  // 处理表单提交
  const handleSubmit = (values) => {
    onSave(values);
    setEditMode(false);
    message.success('患者信息已保存');
  };

  return (
    <Card title="患者基本信息" 
      extra={!loading && (
        <Button 
          type={editMode ? "default" : "primary"} 
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "取消" : "编辑"}
        </Button>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={!editMode}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="hospitalNumber" label="住院号" rules={[{ required: true }]}>
            <Input placeholder="请输入住院号" />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
            <Input placeholder="请输入年龄" />
          </Form.Item>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="diseaseType" label="疾病类型" rules={[{ required: true }]}>
            <Input placeholder="请输入疾病类型" />
          </Form.Item>
        </div>
        
        <Form.Item name="pathology" label="病理信息">
          <TextArea rows={4} placeholder="请输入病理信息" />
        </Form.Item>
        
        <Form.Item name="labTests" label="检验结果">
          <TextArea rows={4} placeholder="请输入检验结果" />
        </Form.Item>
        
        <Form.Item name="examinations" label="检查结果">
          <TextArea rows={4} placeholder="请输入检查结果" />
        </Form.Item>
        
        <Form.Item name="geneticTests" label="基因检测数据">
          <TextArea rows={4} placeholder="请输入基因检测数据" />
        </Form.Item>
        
        {editMode && (
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存患者信息
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default MedicalRecordParser;