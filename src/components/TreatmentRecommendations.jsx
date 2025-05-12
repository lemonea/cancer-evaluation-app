import React from 'react';
import { Card, Typography, Divider, Button } from 'antd';
import { callLinkAIAPI, extractJSONFromText } from '../utils/apiService';

const { Title, Paragraph, Text } = Typography;

const TreatmentRecommendations = ({ 
  patientInfo, 
  recommendations, 
  onGenerateRecommendations, 
  loading 
}) => {
  return (
    <>
      {recommendations ? (
        <Card title="肠癌治疗建议">
          <section style={{ marginBottom: '24px' }}>
            <Title level={5}>治疗方案</Title>
            <Paragraph>{recommendations.treatmentPlan}</Paragraph>
          </section>
          
          <Divider />
          
          <section style={{ marginBottom: '24px' }}>
            <Title level={5}>预后评估</Title>
            <Paragraph>{recommendations.prognosis}</Paragraph>
          </section>
          
          <Divider />
          
          <section style={{ marginBottom: '24px' }}>
            <Title level={5}>营养支持方案</Title>
            <Paragraph>{recommendations.nutritionPlan}</Paragraph>
          </section>
          
          <Divider />
          
          <section>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              注意：以上建议仅供参考，具体治疗方案请遵医嘱
            </Text>
          </section>
        </Card>
      ) : (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Button
            type="primary"
            size="large"
            onClick={onGenerateRecommendations}
            loading={loading}
            disabled={!patientInfo}
          >
            生成个性化治疗建议
          </Button>
        </div>
      )}
    </>
  );
};

export default TreatmentRecommendations;