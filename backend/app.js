const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// 创建Express应用
const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// 创建uploads目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Link AI工作流调用函数
async function callLinkAIWorkflow(workflowId, data) {
  try {
    const response = await axios.post(
      `https://api.link.ai/v1/workflows/${workflowId}/trigger`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINK_AI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Link AI调用失败:', error.response?.data || error.message);
    throw new Error('无法连接到Link AI服务');
  }
}

// 解析上传的文件
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    // 读取上传的文件
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // 调用Link AI工作流解析病历
    const workflowResponse = await callLinkAIWorkflow(
      process.env.DOC_PARSER_WORKFLOW_ID,
      {
        text: fileContent,
        documentType: 'medical-record',
        language: 'chinese'
      }
    );

    res.json({
      success: true,
      data: workflowResponse.output || {}
    });
  } catch (error) {
    console.error('文件处理错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 生成治疗建议
app.post('/api/recommendations', async (req, res) => {
  try {
    const { patientInfo } = req.body;
    
    if (!patientInfo) {
      return res.status(400).json({ success: false, message: '缺少患者信息' });
    }
    
    // 调用Link AI工作流生成建议
    const workflowResponse = await callLinkAIWorkflow(
      process.env.RECOMMENDATION_WORKFLOW_ID,
      { patientInfo }
    );
    
    res.json({
      success: true,
      data: workflowResponse.output || {}
    });
  } catch (error) {
    console.error('生成建议错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
});