
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  Activity, 
  Zap, 
  Target, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

const Performance = () => {
  const { toast } = useToast();
  const [realTimeData, setRealTimeData] = useState({
    latency: 0.3,
    precision: 94.2,
    recall: 89.7,
    falsePositiveRate: 2.1
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        latency: Math.max(0.1, prev.latency + (Math.random() - 0.5) * 0.1),
        precision: Math.max(85, Math.min(98, prev.precision + (Math.random() - 0.5) * 2)),
        recall: Math.max(80, Math.min(95, prev.recall + (Math.random() - 0.5) * 2)),
        falsePositiveRate: Math.max(0.5, Math.min(5, prev.falsePositiveRate + (Math.random() - 0.5) * 0.5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const latencyData = [
    { time: '00:00', latency: 0.25 },
    { time: '04:00', latency: 0.32 },
    { time: '08:00', latency: 0.28 },
    { time: '12:00', latency: 0.35 },
    { time: '16:00', latency: 0.29 },
    { time: '20:00', latency: 0.31 },
  ];

  const accuracyData = [
    { model: 'BERT', precision: 94.2, recall: 89.7, f1: 91.8 },
    { model: 'ResNet', precision: 87.5, recall: 92.1, f1: 89.7 },
    { model: 'Combined', precision: 91.8, recall: 90.9, f1: 91.3 },
  ];

  const systemHealthData = [
    { component: 'API Gateway', status: 99.8, incidents: 0 },
    { component: 'BERT Service', status: 98.5, incidents: 1 },
    { component: 'ResNet Service', status: 99.2, incidents: 0 },
    { component: 'Database', status: 99.9, incidents: 0 },
    { component: 'File Storage', status: 97.8, incidents: 2 },
  ];

  const throughputData = [
    { hour: '00', requests: 145 },
    { hour: '04', requests: 89 },
    { hour: '08', requests: 267 },
    { hour: '12', requests: 198 },
    { hour: '16', requests: 324 },
    { hour: '20', requests: 156 },
  ];

  const getStatusColor = (value, type) => {
    if (type === 'latency') {
      return value < 0.5 ? 'text-green-400' : value < 1.0 ? 'text-yellow-400' : 'text-red-400';
    }
    if (type === 'percentage') {
      return value > 95 ? 'text-green-400' : value > 90 ? 'text-yellow-400' : 'text-red-400';
    }
    if (type === 'falsePositive') {
      return value < 3 ? 'text-green-400' : value < 5 ? 'text-yellow-400' : 'text-red-400';
    }
    return 'text-slate-400';
  };

  const getProgressColor = (value) => {
    if (value > 95) return 'bg-green-500';
    if (value > 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <Helmet>
        <title>System Performance - VISTA</title>
        <meta name="description" content="Real-time system performance monitoring with AI model metrics, latency tracking, and health analytics." />
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Performance Analytics</h1>
              <p className="text-slate-400">Real-time monitoring of AI models, system health, and performance metrics</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 lg:mt-0">
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-animation"></div>
              <span className="text-sm text-slate-300">Live Monitoring</span>
            </div>
          </div>
        </motion.div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Model Latency</p>
                  <p className={`text-2xl font-bold mt-1 ${getStatusColor(realTimeData.latency, 'latency')}`}>
                    {realTimeData.latency.toFixed(2)}s
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Average response time</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Precision</p>
                  <p className={`text-2xl font-bold mt-1 ${getStatusColor(realTimeData.precision, 'percentage')}`}>
                    {realTimeData.precision.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">True positive accuracy</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Recall</p>
                  <p className={`text-2xl font-bold mt-1 ${getStatusColor(realTimeData.recall, 'percentage')}`}>
                    {realTimeData.recall.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Threat detection rate</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">False Positive Rate</p>
                  <p className={`text-2xl font-bold mt-1 ${getStatusColor(realTimeData.falsePositiveRate, 'falsePositive')}`}>
                    {realTimeData.falsePositiveRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Incorrect threat alerts</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Over Time */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Response Latency Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth="2" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Model Accuracy Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 glass-effect border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Model Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="model" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="precision" fill="#22c55e" />
                  <Bar dataKey="recall" fill="#3b82f6" />
                  <Bar dataKey="f1" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6 glass-effect border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6">System Health Status</h3>
            
            <div className="space-y-4">
              {systemHealthData.map((component, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${component.status > 99 ? 'bg-green-500/20' : component.status > 98 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                      {component.status > 99 ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : component.status > 98 ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{component.component}</p>
                      <p className="text-sm text-slate-400">{component.incidents} incidents this week</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Uptime</span>
                        <span className={`text-xs font-medium ${getStatusColor(component.status, 'percentage')}`}>
                          {component.status}%
                        </span>
                      </div>
                      <Progress 
                        value={component.status} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Throughput Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 glass-effect border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Request Throughput</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="requests" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Performance Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-6 glass-effect border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Alerts</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">All systems operating normally</p>
                  <p className="text-xs text-slate-400">Last checked: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-white">BERT service experiencing minor delays</p>
                  <p className="text-xs text-slate-400">Average latency increased by 15% in the last hour</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Performance;
