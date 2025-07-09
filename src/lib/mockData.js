
export const attackTypesData = [
  { name: 'Phishing', value: 400 },
  { name: 'Malware', value: 300 },
  { name: 'DDoS', value: 300 },
  { name: 'Insider Threat', value: 200 },
];

export const modelConfidenceData = [
  { name: '0-20%', value: 10 },
  { name: '21-40%', value: 25 },
  { name: '41-60%', value: 40 },
  { name: '61-80%', value: 80 },
  { name: '81-100%', value: 150 },
];

export const activityTimelineData = [
  { time: '00:00', threats: 10 },
  { time: '03:00', threats: 15 },
  { time: '06:00', threats: 40 },
  { time: '09:00', threats: 80 },
  { time: '12:00', threats: 35 },
  { time: '15:00', threats: 50 },
  { time: '18:00', threats: 65 },
  { time: '21:00', threats: 20 },
];

export const alerts = [
    { id: 1, severity: "Critical", message: "Multiple failed logins from new IP.", time: "2 min ago" },
    { id: 2, severity: "High", message: "Anomalous network traffic detected.", time: "15 min ago" },
    { id: 3, severity: "Medium", message: "Suspicious file detected in sandbox.", time: "1 hour ago" },
    { id: 4, severity: "Low", message: "Port scan detected from external source.", time: "3 hours ago" },
];

export const performanceMetrics = {
  latency: 120,
  precision: 98.5,
  recall: 95.2,
  falsePositiveRate: 1.5,
};

export const performanceTimelineData = [
    { name: 'Week 1', precision: 95, recall: 92 },
    { name: 'Week 2', precision: 96, recall: 93 },
    { name: 'Week 3', precision: 97, recall: 94 },
    { name: 'Week 4', precision: 98.5, recall: 95.2 },
];
  