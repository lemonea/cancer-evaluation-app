// 模拟的Link AI API调用
const mockResponses = {
  patientInfo: {
    hospitalNumber: "ZY202411056",
    age: "62",
    gender: "男",
    diseaseType: "降结肠腺癌",
    pathology: "降结肠腺癌，中-低分化，浸润至浆膜层",
    labTests: "血常规：WBC 7.2×10^9/L，RBC 3.8×10^12/L",
    examinations: "腹部增强CT：降结肠见5.6×4.2cm肿块",
    geneticTests: "KRAS基因：12号密码子突变（G12D）"
  },
  recommendations: {
    treatmentPlan: "基于患者KRAS基因突变和无明确转移情况，建议行肿瘤根治术，术后采用FOLFOX方案辅助化疗6个月。由于KRAS突变状态，不推荐使用抗EGFR靶向药物。",
    prognosis: "患者为III期降结肠腺癌，KRAS突变。手术联合化疗后5年生存率约50-60%。需定期随访监测复发转移。",
    nutritionPlan: "手术前后均需高蛋白、易消化饮食，每日蛋白质摄入≥1.2g/kg体重。化疗期间注意补充维生素B族，保持充分水分摄入，少量多餐。避免刺激性食物。"
  }
};

// API响应缓存
const apiCache = new Map();

// 模拟API调用，实际项目中替换为真实的API调用
export const callLinkAIAPI = async (appCode, query, options = {}) => {
  const {
    useCache = true,
    timeout = 30000,
    maxRetries = 3
  } = options;
  
  // 创建缓存键
  const cacheKey = `${appCode}_${JSON.stringify(query)}`;
  
  // 检查缓存
  if (useCache && apiCache.has(cacheKey)) {
    console.log('使用缓存的API响应');
    return apiCache.get(cacheKey);
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 根据appCode返回不同的模拟响应
  let response;
  if (query.includes('治疗') || appCode.includes('RECOMMENDATION')) {
    response = JSON.stringify(mockResponses.recommendations);
  } else {
    response = JSON.stringify(mockResponses.patientInfo);
  }
  
  // 缓存响应
  if (useCache) {
    apiCache.set(cacheKey, response);
  }
  
  return response;
};

// 解析JSON响应
export const extractJSONFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 尝试从文本中提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error('JSON提取失败:', err);
      }
    }
    return null;
  }
};