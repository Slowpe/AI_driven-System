import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import ResponsiveChart from '@/components/ResponsiveChart';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useLiveMonitor } from '@/contexts/LiveMonitorContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const getSeverityClass = (severity) => {
  switch (severity) {
    case 'Critical': return 'text-red-500';
    case 'High': return 'text-yellow-500';
    case 'Medium': return 'text-orange-400';
    default: return 'text-blue-400';
  }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const {
    stats,
    activityTimeline,
    attackTypes,
    modelConfidence
  } = useLiveMonitor();
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const userInfo = await authAPI.getCurrentUser();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>VISTA - Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard for VISTA, showing summarized insights, threat levels, and real-time alerts." />
      </Helmet>
      <div className="space-y-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.full_name || 'Analyst'}!
          </h1>
          <p className="text-muted-foreground">Here's the real-time security overview for {user?.company_name || 'your company'}.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Total Alerts (24h)</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalAlerts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Real-time monitoring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Threats Neutralized</CardTitle>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.neutralized}%</div>
              <p className="text-xs text-muted-foreground">Detection accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">High-Risk Events</CardTitle>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">System Uptime</CardTitle>
              <Clock className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.uptime}%</div>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Attack Types Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Threat Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart width={350} height={250}>
                <Pie
                  data={attackTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {attackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>

          {/* Model Confidence Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart width={350} height={250} data={modelConfidence}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Threat Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Time</th>
                    <th className="px-2 py-1 text-left">Event</th>
                    <th className="px-2 py-1 text-left">Severity</th>
                    <th className="px-2 py-1 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activityTimeline.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-2 py-1 whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{item.event}</td>
                      <td className={getSeverityClass(item.severity) + " px-2 py-1 whitespace-nowrap font-bold"}>{item.severity}</td>
                      <td className="px-2 py-1">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;