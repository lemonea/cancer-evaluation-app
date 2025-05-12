import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Avatar, Spin, Alert } from 'antd';

// 模拟数据，后续可替换为真实API调用
const extractBiomarkersFromText = (text) => {
  const COMMON_BIOMARKERS = [
    'KRAS', 'BRAF', 'NRAS', 'EGFR', 'ALK', 'ROS1', 'MET', 'ERBB2', 'HER2', 
    'BRCA1', 'BRCA2', 'PIK3CA', 'PTEN', 'TP53', 'RB1', 'NF1', 'NF2'
  ];
  
  const results = [];
  
  // 检查文本中是否包含常见生物标志物
  for (const biomarker of COMMON_BIOMARKERS) {
    if (text.includes(biomarker)) {
      // 尝试找到突变状态
      let mutation = 'Unknown';
      let status = 'Unknown';
      
      // 检查突变模式
      const mutationRegex = new RegExp(`${biomarker}\\s+([A-Z]\\d+[A-Z]|mutation|wild[\\-\\s]type)`, 'i');
      const mutationMatch = text.match(mutationRegex);
      
      if (mutationMatch) {
        mutation = mutationMatch[1];
        status = mutation.toLowerCase().includes('wild') ? 'Normal' : 'Mutated';
      }
      
      results.push({ name: biomarker, mutation, status });
    }
  }
  
  return results;
};

const BiomarkerAnalysis = ({ patientInfo, onAnalysisComplete }) => {
  const [biomarkers, setBiomarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientInfo) {
      analyzePatient();
    }
  }, [patientInfo]);

  const analyzePatient = async () => {
    if (!patientInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 将患者信息转为文本
      const patientText = typeof patientInfo === 'string' 
        ? patientInfo 
        : Object.entries(patientInfo)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
      
      // 简单的本地生物标志物提取逻辑
      const extractedBiomarkers = extractBiomarkersFromText(patientText);
      setBiomarkers(extractedBiomarkers);
      
      // 通知父组件分析完成
      if (onAnalysisComplete) {
        onAnalysisComplete(extractedBiomarkers);
      }
    } catch (err) {
      console.error('生物标志物分析错误:', err);
      setError('分析过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin tip="分析中..." />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <Card title="生物标志物分析" style={{ marginTop: '20px' }}>
      {biomarkers.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={biomarkers}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    style={{ 
                      backgroundColor: 
                        item.status === 'Mutated' ? '#ff4d4f' : 
                        item.status === 'Normal' ? '#52c41a' : 
                        '#faad14' 
                    }}
                  >
                    {item.name.charAt(0)}
                  </Avatar>
                }
                title={
                  <span>
                    {item.name} 
                    <Tag 
                      color={
                        item.status === 'Mutated' ? 'red' : 
                        item.status === 'Normal' ? 'green' : 
                        'orange'
                      }
                    >
                      {item.status}
                    </Tag>
                  </span>
                }
                description={item.mutation}
              />
            </List.Item>
          )}
        />
      ) : (
        <p>未检测到生物标志物</p>
      )}
    </Card>
  );
};

export default BiomarkerAnalysis;