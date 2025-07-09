import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { generateLogEntry, ANOMALIES } from '@/lib/logGenerator';
import { useToast } from '@/components/ui/use-toast';

const LiveMonitorContext = createContext();

const MAX_LOGS = 2000;
const UPDATE_INTERVAL = 1500;

export const useLiveMonitor = () => {
  const context = useContext(LiveMonitorContext);
  if (!context) {
    throw new Error('useLiveMonitor must be used within a LiveMonitorProvider');
  }
  return context;
};

export const LiveMonitorProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({
    totalAlerts: 0,
    neutralized: 0,
    highRisk: 0,
    uptime: 99.9,
    threatDistribution: { normal: 0, low: 0, medium: 0, high: 0, critical: 0 },
    recentThreats: 0,
    totalThreats: 0
  });
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [attackTypes, setAttackTypes] = useState([]);
  const [modelConfidence, setModelConfidence] = useState([]);
  const logIdCounter = useRef(0);
  const { toast } = useToast();

  // Initialize with some logs
  useEffect(() => {
    const initialLogs = [];
    for (let i = 0; i < 100; i++) {
      initialLogs.push(generateLogEntry(logIdCounter.current++));
    }
    setLogs(initialLogs);
  }, []);

  // Update logs and calculate stats
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs(prevLogs => {
        const newLog = generateLogEntry(logIdCounter.current++);
        const updatedLogs = [newLog, ...prevLogs].slice(0, MAX_LOGS);

        // Show toast for critical and high anomalies
        if (newLog.anomaly && (newLog.anomaly.label === ANOMALIES.critical.label || newLog.anomaly.label === ANOMALIES.high.label)) {
          toast({
            title: newLog.anomaly.label,
            description: newLog.message,
            variant: 'destructive',
          });
        }
        
        return updatedLogs;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, toast]);

  // Calculate dashboard stats from logs
  useEffect(() => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter logs from last 24 hours
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= last24Hours);
    
    // Count anomalies by severity
    const threatCounts = { normal: 0, low: 0, medium: 0, high: 0, critical: 0 };
    let totalThreats = 0;
    let highRiskCount = 0;
    
    recentLogs.forEach(log => {
      if (log.anomaly) {
        totalThreats++;
        if (log.anomaly.label === ANOMALIES.critical.label) {
          threatCounts.critical++;
          highRiskCount++;
        } else if (log.anomaly.label === ANOMALIES.high.label) {
          threatCounts.high++;
          highRiskCount++;
        } else if (log.anomaly.label === ANOMALIES.medium.label) {
          threatCounts.medium++;
        } else if (log.anomaly.label === ANOMALIES.low.label) {
          threatCounts.low++;
        }
      } else {
        threatCounts.normal++;
      }
    });

    // Calculate neutralization rate (simulated)
    const neutralized = Math.min(95, Math.max(70, 85 + (highRiskCount * 2)));

    // Update stats
    setStats({
      totalAlerts: recentLogs.length,
      neutralized,
      highRisk: highRiskCount,
      uptime: 99.9 - (highRiskCount * 0.01),
      threatDistribution: threatCounts,
      recentThreats: totalThreats,
      totalThreats: logs.filter(log => log.anomaly).length
    });

    // Update attack types for charts
    const attackTypesData = Object.entries(threatCounts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count
      }));
    setAttackTypes(attackTypesData);

    // Update activity timeline
    const timelineData = recentLogs
      .filter(log => log.anomaly)
      .slice(0, 20)
      .map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        event: log.anomaly.label,
        severity: log.anomaly.label.includes('Critical') ? 'Critical' : 
                 log.anomaly.label.includes('DDoS') ? 'High' : 
                 log.anomaly.label.includes('Port Scan') ? 'Medium' : 'Low',
        description: log.message
      }));
    setActivityTimeline(timelineData);

    // Update model confidence (simulated based on threat detection)
    const confidenceData = [
      { name: 'BERT Model', value: Math.min(95, 85 + (totalThreats * 2)) },
      { name: 'ResNet Model', value: Math.min(92, 80 + (highRiskCount * 3)) },
      { name: 'Ensemble Model', value: Math.min(98, 90 + (totalThreats * 1.5)) }
    ];
    setModelConfidence(confidenceData);

  }, [logs]);

  const value = {
    logs,
    setLogs,
    isPaused,
    setIsPaused,
    filter,
    setFilter,
    stats,
    activityTimeline,
    attackTypes,
    modelConfidence,
    // Dashboard-specific data
    dashboardData: {
      stats,
      activityTimeline,
      attackTypes,
      modelConfidence
    }
  };

  return (
    <LiveMonitorContext.Provider value={value}>
      {children}
    </LiveMonitorContext.Provider>
  );
}; 