import React, { useState } from 'react';
import { Layout, Card, Button, Upload, message, Tabs, Spin, Typography, Form, Input, Divider } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

// Link AI API配置
const LINK_AI_API_KEY = import.meta.env.VITE_LINK_AI_API_KEY || 'your_api_key';
const MEDICAL_RECORD_PARSER_APP_CODE = import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || 'your_parser_code';
const TREATMENT_RECOMMENDATION_APP_CODE = import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE || 'your_recommendation_code';

// 调试模式设置，设为true则使用测试数据
const TEST_MODE = true;

// API URL
const API_URL = "https://api.link-ai.tech/v1/chat/memory/completions";

function App() {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [manualInput, setManualInput] = useState(false);
  const [form] = Form.useForm();

  // Link AI API调用函数
  const callLinkAIAPI = async (appCode, query) => {
    console.log(`调用Link AI API，应用代码: ${appCode}`);
    console.log(`查询内容长度: ${query.length}`);
    console.log(`查询内容预览: ${query.substring(0, 100)}...`);
    
    try {
      const data = {
        app_code: appCode,
        messages: [
          { role: "user", content: query }
        ],
        stream: false
      };
      
      console.log(`请求数据: ${JSON.stringify(data, null, 2)}`);
      
      const response = await axios.post(
        API_URL,
        data,
        {
          headers: {
            'Authorization': `Bearer ${LINK_AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      console.log('API响应状态:', response.status);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        console.log(`API响应内容预览: ${content.substring(0, 100)}...`);
        return content;
      }
      
      console.error('API响应格式不符合预期:', response.data);
      throw new Error('无效的API响应');
    } catch (error) {
      console.error('Link AI API调用失败:', error.message);
      if (error.response) {
        console.error('错误响应数据:', error.response.data);
        console.error('错误响应状态:', error.response.status);
      }
      throw error;
    }
  };

  // 解析JSON辅助函数
  const extractJSONFromText = (text) => {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch (e) {
      console.log('直接解析JSON失败，尝试从文本中提取');
      // 尝试从文本中提取JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('JSON提取后解析失败:', innerError);
        }
      }
      console.error('无法从文本中提取JSON');
      return null;
    }
  };

  // 读取文件内容
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (info) => {
    const { status } = info.file;
    
    console.log("文件上传状态:", status);
    
    if (status === 'done') {
      setLoading(true);
      message.loading('正在解析病历文件...');
      
      try {
        // 测试模式
        if (TEST_MODE) {
          console.log('使用测试模式...');
          setTimeout(() => {
            setPatientInfo({
              hospitalNumber: "ZY202411056",
              age: "62",
              gender: "男",
              diseaseType: "降结肠腺癌",
              pathology: "降结肠腺癌，中-低分化，浸润至浆膜层",
              labTests: "血常规：WBC 7.2×10^9/L，RBC 3.8×10^12/L",
              examinations: "腹部增强CT：降结肠见5.6×4.2cm肿块",
              geneticTests: "KRAS基因：12号密码子突变（G12D）"
            });
            setActiveTab("2");
            message.success('病历解析成功（测试数据）');
            setLoading(false);
          }, 1000);
          return;
        }
        
        // 读取文件内容
        const fileContent = await readFileContent(info.file.originFileObj);
        console.log(`文件长度: ${fileContent.length}`);
        console.log(`文件内容预览: ${fileContent.substring(0, 100)}...`);
        
        // 调用Link AI解析病历
        console.log('开始解析病历...');
        const result = await callLinkAIAPI(MEDICAL_RECORD_PARSER_APP_CODE, fileContent);
        
        // 解析返回的JSON
        const parsedInfo = extractJSONFromText(result);
        
        if (parsedInfo) {
          console.log('解析病历成功:', JSON.stringify(parsedInfo, null, 2));
          setPatientInfo(parsedInfo);
          setActiveTab("2");
          message.success('病历解析成功');
        } else {
          message.error('病历解析失败，请尝试手动输入');
          setManualInput(true);
        }
      } catch (error) {
        console.error('文件处理错误:', error);
        message.error('文件处理失败: ' + error.message);
        setManualInput(true);
      } finally {
        if (!TEST_MODE) {
          setLoading(false);
        }
      }
    } else if (status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 手动提交患者信息
  const handleManualSubmit = (values) => {
    setPatientInfo(values);
    setActiveTab("2");
    message.success('患者信息已保存');
  };

  // 生成治疗建议
  const generateRecommendations = async () => {
    if (!patientInfo) {
      message.warning('请先提供患者信息');
      return;
    }
    
    setLoading(true);
    message.loading('正在生成治疗建议...');
    
    try {
      // 测试模式
      if (TEST_MODE) {
        console.log('使用测试模式生成治疗建议...');
        setTimeout(() => {
          // 检查是否有KRAS突变
          const hasKrasMutation = patientInfo.geneticTests && 
                                patientInfo.geneticTests.includes('KRAS') && 
                                patientInfo.geneticTests.includes('突变');
          
          // 检查是否有转移
          const hasMetastasis = patientInfo.examinations && 
                              (patientInfo.examinations.includes('转移') || 
                               patientInfo.examinations.includes('侵犯'));
          
          // 生成定制化的建议
          setRecommendations({
            treatmentPlan: `基于患者${hasKrasMutation ? 'KRAS基因突变' : 'KRAS野生型'}和${hasMetastasis ? '存在转移' : '无明确转移'}情况，建议${hasMetastasis ? '行肿瘤根治术+转移灶切除术，术后' : '行肿瘤根治术，术后'}采用${hasKrasMutation ? 'FOLFOX' : 'FOLFIRI'}方案辅助化疗6个月。${!hasKrasMutation ? '由于KRAS为野生型，可考虑联合抗EGFR靶向药物如西妥昔单抗。' : '由于KRAS突变状态，不推荐使用抗EGFR靶向药物。'}`,
            
            prognosis: `患者为${hasMetastasis ? 'IV' : 'III'}期${patientInfo.diseaseType || '结直肠癌'}，${hasKrasMutation ? 'KRAS突变' : 'KRAS野生型'}。手术联合化疗后5年生存率约${hasMetastasis ? '25-30%' : '50-60%'}。需定期随访监测复发转移。`,
            
            nutritionPlan: "手术前后均需高蛋白、易消化饮食，每日蛋白质摄入≥1.2g/kg体重。化疗期间注意补充维生素B族，保持充分水分摄入，少量多餐。避免刺激性食物。定期监测营养状态，必要时给予肠内或肠外营养支持。"
          });
          
          setActiveTab("3");
          message.success('治疗建议生成成功（测试数据）');
          setLoading(false);
        }, 1000);
        return;
      }
      
      // 将患者信息转为JSON字符串
      const query = JSON.stringify(patientInfo, null, 2);
      
      // 调用Link AI生成治疗建议
      console.log('开始生成治疗建议...');
      const result = await callLinkAIAPI(TREATMENT_RECOMMENDATION_APP_CODE, query);
      
      // 解析返回的JSON
      const parsedRecommendations = extractJSONFromText(result);
      
      if (parsedRecommendations) {
        console.log('生成治疗建议成功:', JSON.stringify(parsedRecommendations, null, 2));
        setRecommendations(parsedRecommendations);
        setActiveTab("3");
        message.success('治疗建议生成成功');
      } else {
        message.error('治疗建议生成失败，请重试');
      }
    } catch (error) {
      console.error('生成建议错误:', error);
      message.error('生成建议失败: ' + error.message);
    } finally {
      if (!TEST_MODE) {
        setLoading(false);
      }
    }
  };
  
  // 上传组件配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // 假上传URL
    onChange: handleFileUpload,
    customRequest: ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 20px' }}>
        <div style={{ color: 'white', fontSize: '20px', lineHeight: '64px' }}>
          肠癌病情评估系统
        </div>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        <Spin spinning={loading} tip="处理中...">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 输入患者信息标签页 */}
            <TabPane tab="输入患者信息" key="1">
              <Card>
                <Title level={4}>选择输入方式</Title>
                <Button 
                  type={!manualInput ? "primary" : "default"}
                  onClick={() => setManualInput(false)}
                  style={{ marginRight: '10px' }}
                >
                  上传病历文件
                </Button>
                <Button 
                  type={manualInput ? "primary" : "default"}
                  onClick={() => setManualInput(true)}
                >
                  手动输入
                </Button>
                
                <Divider />
                
                {!manualInput ? (
                  <div>
                    <Paragraph>请上传患者病历文件（支持txt格式）</Paragraph>
                    <Dragger {...uploadProps} accept=".txt">
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件至此区域上传</p>
                      <p className="ant-upload-hint">
                        系统将自动解析患者信息，您也可以在下一步中修改
                      </p>
                    </Dragger>
                  </div>
                ) : (
                  <Form 
                    form={form}
                    layout="vertical"
                    onFinish={handleManualSubmit}
                  >
                    <Form.Item name="hospitalNumber" label="住院号" rules={[{ required: true }]}>
                      <Input placeholder="请输入住院号" />
                    </Form.Item>
                    <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                      <Input placeholder="请输入年龄" />
                    </Form.Item>
                    <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                      <Input placeholder="请输入性别" />
                    </Form.Item>
                    <Form.Item name="diseaseType" label="疾病类型" rules={[{ required: true }]}>
                      <Input placeholder="请输入疾病类型" />
                    </Form.Item>
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
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        保存患者信息
                      </Button>
                    </Form.Item>
                  </Form>
                )}
              </Card>
            </TabPane>
            
            {/* 患者信息展示标签页 */}
            <TabPane tab="患者信息" key="2" disabled={!patientInfo}>
              {patientInfo && (
                <Card title="患者基本信息">
                  <p><strong>住院号:</strong> {patientInfo.hospitalNumber}</p>
                  <p><strong>年龄:</strong> {patientInfo.age}</p>
                  <p><strong>性别:</strong> {patientInfo.gender}</p>
                  <p><strong>疾病类型:</strong> {patientInfo.diseaseType}</p>
                  
                  {patientInfo.pathology && (
                    <>
                      <Divider />
                      <Title level={5}>病理信息</Title>
                      <p>{patientInfo.pathology}</p>
                    </>
                  )}
                  
                  {patientInfo.labTests && (
                    <>
                      <Divider />
                      <Title level={5}>检验结果</Title>
                      <p>{patientInfo.labTests}</p>
                    </>
                  )}
                  
                  {patientInfo.examinations && (
                    <>
                      <Divider />
                      <Title level={5}>检查结果</Title>
                      <p>{patientInfo.examinations}</p>
                    </>
                  )}
                  
                  {patientInfo.geneticTests && (
                    <>
                      <Divider />
                      <Title level={5}>基因检测数据</Title>
                      <p>{patientInfo.geneticTests}</p>
                    </>
                  )}
                  
                  <Divider />
                  <Button type="primary" onClick={generateRecommendations}>
                    生成治疗建议
                  </Button>
                </Card>
              )}
            </TabPane>
            
            {/* 治疗建议标签页 */}
            <TabPane tab="治疗建议" key="3" disabled={!recommendations}>
              {recommendations && (
                <Card title="肠癌治疗建议">
                  <Title level={5}>治疗方案</Title>
                  <Paragraph>{recommendations.treatmentPlan}</Paragraph>
                  
                  <Divider />
                  <Title level={5}>预后说明</Title>
                  <Paragraph>{recommendations.prognosis}</Paragraph>
                  
                  <Divider />
                  <Title level={5}>营养方案</Title>
                  <Paragraph>{recommendations.nutritionPlan}</Paragraph>
                  
                  <Divider />
                  <Text type="secondary">
                    注意：以上建议仅供参考，具体治疗方案请遵医嘱。
                  </Text>
                </Card>
              )}
            </TabPane>
          </Tabs>
        </Spin>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        肠癌病情评估系统 ©2025
      </Footer>
    </Layout>
  );
}

export default App;