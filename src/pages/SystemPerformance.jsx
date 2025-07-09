import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import ResponsiveChart from '@/components/ResponsiveChart';
import { motion } from 'framer-motion';
import { performanceMetrics as initialMetrics, performanceTimelineData as initialTimelineData } from '@/lib/mockData';
import { Zap, Target, Repeat, AlertCircle } from 'lucide-react';

const Gauge = ({ value, label, max = 100, unit = '', icon: Icon }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="relative h-32 w-32">
        <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="3"
            />
            <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray={`${(value / max) * 100}, 100`}
                initial={{ strokeDasharray: `0, 100` }}
                animate={{ strokeDasharray: `${(value / max) * 100}, 100` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
                {Icon && <Icon className="w-5 h-5 text-muted-foreground mb-1"/>}
                <span className="text-2xl font-bold">{value}{unit}</span>
            </div>
        </div>
    </div>
    <p className="mt-2 font-semibold text-muted-foreground">{label}</p>
  </div>
);


const SystemPerformance = () => {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [timelineData, setTimelineData] = useState(initialTimelineData);

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => ({
                latency: Math.max(50, prev.latency + Math.floor(Math.random() * 20) - 10),
                precision: parseFloat(Math.min(99.9, Math.max(90, prev.precision + (Math.random() - 0.5))).toFixed(1)),
                recall: parseFloat(Math.min(99.9, Math.max(90, prev.recall + (Math.random() - 0.5))).toFixed(1)),
                falsePositiveRate: parseFloat(Math.min(5, Math.max(0.5, prev.falsePositiveRate + (Math.random() - 0.5) * 0.2)).toFixed(1)),
            }));

            setTimelineData(prev => {
                const newWeekNum = parseInt(prev[prev.length - 1].name.split(' ')[1]) + 1;
                const lastData = prev[prev.length - 1];
                const newDataPoint = {
                    name: `Week ${newWeekNum}`,
                    precision: parseFloat(Math.min(99, Math.max(92, lastData.precision + (Math.random() - 0.4))).toFixed(1)),
                    recall: parseFloat(Math.min(99, Math.max(92, lastData.recall + (Math.random() - 0.4))).toFixed(1)),
                };
                return [...prev.slice(1), newDataPoint];
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

  return (
    <>
      <Helmet>
        <title>VISTA - System Performance</title>
        <meta name="description" content="Real-time dashboard of model latency, precision, recall, and other system health metrics." />
      </Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">System Performance Analytics</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Live Performance Metrics</CardTitle>
                <CardDescription>Current state of system health and model accuracy.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
                    <Gauge value={metrics.latency} label="Latency" max={200} unit="ms" icon={Zap}/>
                    <Gauge value={metrics.precision} label="Precision" max={100} unit="%" icon={Target}/>
                    <Gauge value={metrics.recall} label="Recall" max={100} unit="%" icon={Repeat}/>
                    <Gauge value={metrics.falsePositiveRate} label="False Positive Rate" max={5} unit="%" icon={AlertCircle}/>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Tracking precision and recall trends weekly.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveChart>
                    <LineChart data={timelineData}>
                         <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" domain={[90, 100]} unit="%"/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="precision" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }}/>
                        <Line type="monotone" dataKey="recall" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }}/>
                    </LineChart>
                </ResponsiveChart>
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SystemPerformance;