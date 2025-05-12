import React, { useState } from "react";
import { Layout, Card, Tabs, Spin, Typography, message, Progress, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import MedicalRecordParser from "./components/MedicalRecordParser";
import BiomarkerAnalysis from "./components/BiomarkerAnalysis";
import TreatmentRecommendations from "./components/TreatmentRecommendations";
import { callLinkAIAPI, extractJSONFromText } from "./utils/apiService";
import "./App.css";
import "./styles/enhanced.css";  // 导入增强样式

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

// 应用代码 - 从环境变量读取
const PARSER_APP_CODE = import.meta.env.VITE_MEDICAL_RECORD_PARSER_APP_CODE || "zAgFDEkr";
const RECOMMENDATION_APP_CODE = import.meta.env.VITE_TREATMENT_RECOMMENDATION_APP_CODE || "lF0qm8f8";
// 测试模式 - 从环境变量读取
const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true';

function App() {
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);
  const [biomarkers, setBiomarkers] = useState([]);
  const [recommendations, setRecommendations] = useState(null);

  // 读取文件内容
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('未提供文件对象'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target.result) {
          resolve(event.target.result);
        } else {
          reject(new Error('文件读取结果为空'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // 处理文件上传
  const handleFileUpload = async (info) => {
    const { status } = info.file;
    
    if (status === "done") {
      setLoading(true);
      setProgress(10);
      setStatusMessage("正在解析病历文件...");
      
      try {
        // 读取文件内容
        const fileContent = await readFileContent(info.file.originFileObj);
        console.log('文件内容长度:', fileContent.length);
        console.log('文件内容预览:', fileContent.substring(0, 100));
        
        // 更新进度
        setProgress(30);
        setStatusMessage("分析患者信息...");
        
        // 调用Link AI API
        const result = await callLinkAIAPI(PARSER_APP_CODE, fileContent, {
          timeout: 30000,
          useCache: true
        });
        
        // 解析返回的JSON
        const parsedInfo = extractJSONFromText(result);
        
        if (parsedInfo) {
          // 更新患者信息
          setPatientInfo(parsedInfo);
          setActiveTab("2");
          message.success("病历解析成功，请检查并确认信息准确性");
        } else {
          message.error("病历解析失败，格式不正确");
        }
      } catch (error) {
        console.error("文件处理错误:", error);
        message.error("文件处理失败: " + error.message);
      } finally {
        setProgress(100);
        setStatusMessage("完成");
        // 延迟关闭加载状态
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    } else if (status === "error") {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };
  
  // 保存编辑后的患者信息
  const handleSavePatientInfo = (updatedInfo) => {
    setPatientInfo(updatedInfo);
  };
  
  // 生成治疗建议
  const generateRecommendations = async () => {
    if (!patientInfo) {
      message.warning("请先提供患者信息");
      return;
    }
    
    setLoading(true);
    setProgress(10);
    setStatusMessage("准备生成治疗建议...");
    
    try {
      // 构建查询 - 将患者信息转换为JSON字符串
      const query = JSON.stringify(patientInfo, null, 2);
      
      // 更新进度
      setProgress(30);
      setStatusMessage("生成治疗建议中...");
      
      // 使用治疗建议专用应用
      const result = await callLinkAIAPI(RECOMMENDATION_APP_CODE, query, {
        timeout: 35000,
        useCache: true
      });
      
      // 更新进度
      setProgress(70);
      setStatusMessage("处理建议结果...");
      
      // 解析JSON响应
      const parsedRecommendations = extractJSONFromText(result);
      
      if (parsedRecommendations) {
        setRecommendations(parsedRecommendations);
        setActiveTab("3");
        message.success("治疗建议生成成功");
      } else {
        message.error("治疗建议解析失败");
      }
    } catch (error) {
      console.error("生成建议错误:", error);
      message.error("生成建议失败: " + error.message);
    } finally {
      setProgress(100);
      setStatusMessage("完成");
      // 延迟关闭加载状态
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };
  
  // 处理生物标志物分析完成
  const handleBiomarkerAnalysisComplete = (analyzedBiomarkers) => {
    setBiomarkers(analyzedBiomarkers);
  };
  
  // 上传组件配置
  const uploadProps = {
    name: "file",
    multiple: false,
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76", // 假上传URL
    onChange: handleFileUpload,
    customRequest: ({ file, onSuccess, onError }) => {
      // 确保文件对象有效
      if (!file) {
        onError(new Error('无效的文件对象'));
        return;
      }
      
      console.log('开始处理文件:', file.name, '大小:', file.size);
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    showUploadList: true, // 显示上传列表
    maxCount: 1, // 最多上传1个文件
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
    }
  };

  // 定义标签页项目 - 使用 Ant Design v5 推荐的 items 属性
  const tabItems = [
    {
      key: "1",
      label: "1. 上传病历",
      children: (
        <Card>
          <Title level={4}>上传病历文件</Title>
          <Paragraph>请上传患者病历文件（支持txt格式）</Paragraph>
          <Dragger {...uploadProps} accept=".txt">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件至此区域上传</p>
            <p className="ant-upload-hint">
              系统将自动解析患者信息
            </p>
          </Dragger>
        </Card>
      )
    },
    {
      key: "2",
      label: "2. 患者信息确认",
      disabled: !patientInfo,
      children: patientInfo && (
        <>
          <MedicalRecordParser 
            initialData={patientInfo} 
            onSave={handleSavePatientInfo}
            loading={loading}
          />
          
          <BiomarkerAnalysis 
            patientInfo={patientInfo}
            onAnalysisComplete={handleBiomarkerAnalysisComplete}
          />
        </>
      )
    },
    {
      key: "3",
      label: "3. 治疗建议",
      disabled: !patientInfo,
      children: (
        <TreatmentRecommendations
          patientInfo={patientInfo}
          recommendations={recommendations}
          onGenerateRecommendations={generateRecommendations}
          loading={loading}
        />
      )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#001529", padding: "0 20px" }}>
        <div style={{ color: "white", fontSize: "20px", lineHeight: "64px" }}>
          肠癌病情评估系统
        </div>
      </Header>
      
      <Content style={{ padding: "20px" }}>
        <Spin spinning={loading} tip={statusMessage}>
          {loading && <Progress percent={progress} status="active" />}
          
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Spin>
      </Content>
      
      <Footer style={{ textAlign: "center" }}>
        肠癌病情评估系统 ©2025
      </Footer>
    </Layout>
  );
}

export default App;