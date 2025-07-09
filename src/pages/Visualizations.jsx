
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Network, Calendar as Timeline, Eye, MapPin, Activity, Zap, AlertTriangle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const Visualizations = () => {
  const { toast } = useToast();
  const [selectedVisualization, setSelectedVisualization] = useState('network');

  const networkNodes = [
    { id: 1, x: 150, y: 100, type: 'server', status: 'safe' },
    { id: 2, x: 300, y: 150, type: 'workstation', status: 'threat' },
    { id: 3, x: 450, y: 100, type: 'database', status: 'safe' },
    { id: 4, x: 250, y: 250, type: 'router', status: 'warning' },
    { id: 5, x: 400, y: 300, type: 'firewall', status: 'safe' },
  ];

  const timelineEvents = [
    { time: '09:15', event: 'Suspicious login attempt', severity: 'high', x: 50 },
    { time: '09:32', event: 'Malware signature detected', severity: 'high', x: 150 },
    { time: '09:45', event: 'Firewall rule triggered', severity: 'medium', x: 250 },
    { time: '10:12', event: 'Anomalous network traffic', severity: 'medium', x: 350 },
    { time: '10:28', event: 'Threat neutralized', severity: 'low', x: 450 },
  ];

  const anomalyRegions = [
    { x: 100, y: 80, width: 120, height: 80, intensity: 'high' },
    { x: 300, y: 150, width: 100, height: 60, intensity: 'medium' },
    { x: 200, y: 250, width: 80, height: 100, intensity: 'low' },
  ];

  const handleVisualizationAction = (action) => {
    toast({
      title: `🚧 ${action} functionality isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`
    });
  };

  return (
    <>
      <Helmet>
        <title>Threat Visualizations - VISTA</title>
        <meta name="description" content="Interactive threat visualizations including network maps, timeline analysis, and anomaly detection overlays." />
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Threat Visualizations</h1>
              <p className="text-slate-400">Interactive network maps and threat progression analysis</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Button
                onClick={() => handleVisualizationAction('Export')}
                variant="outline"
                className="border-green-500/30"
              >
                Export View
              </Button>
              <Button
                onClick={() => handleVisualizationAction('Full Screen')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Visualization Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 glass-effect border-slate-700">
            <Tabs value={selectedVisualization} onValueChange={setSelectedVisualization}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="network" className="data-[state=active]:bg-blue-600">
                  <Network className="h-4 w-4 mr-2" />
                  Network Map
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-600">
                  <Activity className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="anomaly" className="data-[state=active]:bg-red-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Anomaly Map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="network" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Network Intrusion Map</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-slate-300">Safe</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-slate-300">Warning</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-slate-300">Threat</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative bg-slate-900/50 rounded-lg p-8 h-96 cyber-grid">
                    {/* Network Connections */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Connection lines */}
                      <line x1="150" y1="100" x2="300" y2="150" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
                      <line x1="300" y1="150" x2="450" y2="100" stroke="#ef4444" strokeWidth="3" filter="url(#glow)" />
                      <line x1="150" y1="100" x2="250" y2="250" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
                      <line x1="250" y1="250" x2="400" y2="300" stroke="#eab308" strokeWidth="2" opacity="0.8" />
                      <line x1="450" y1="100" x2="400" y2="300" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
                    </svg>

                    {/* Network Nodes */}
                    {networkNodes.map((node) => (
                      <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: node.id * 0.1 }}
                        className={`absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${
                          node.status === 'safe' ? 'bg-green-500/20 border-2 border-green-400' :
                          node.status === 'warning' ? 'bg-yellow-500/20 border-2 border-yellow-400' :
                          'bg-red-500/20 border-2 border-red-400 pulse-animation'
                        }`}
                        style={{ left: node.x - 24, top: node.y - 24 }}
                        onClick={() => handleVisualizationAction(`Node ${node.id} details`)}
                      >
                        {node.type === 'server' && <Shield className="h-6 w-6 text-white" />}
                        {node.type === 'workstation' && <Activity className="h-6 w-6 text-white" />}
                        {node.type === 'database' && <Network className="h-6 w-6 text-white" />}
                        {node.type === 'router' && <Zap className="h-6 w-6 text-white" />}
                        {node.type === 'firewall' && <Shield className="h-6 w-6 text-white" />}
                      </motion.div>
                    ))}

                    {/* Threat Indicators */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute top-4 right-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <span className="text-red-400 font-medium">Active Threat</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">Workstation compromised</p>
                    </motion.div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Threat Progression Timeline</h3>
                  
                  <div className="relative bg-slate-900/50 rounded-lg p-8 h-96">
                    {/* Timeline Base */}
                    <div className="absolute bottom-16 left-8 right-8 h-1 bg-slate-600 rounded"></div>
                    
                    {/* Timeline Events */}
                    {timelineEvents.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.2 }}
                        className="absolute"
                        style={{ left: event.x + 32, bottom: 80 }}
                      >
                        <div className={`w-4 h-4 rounded-full mb-4 ${
                          event.severity === 'high' ? 'bg-red-400' :
                          event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        
                        <div className={`p-3 rounded-lg border max-w-48 ${
                          event.severity === 'high' ? 'threat-high' :
                          event.severity === 'medium' ? 'threat-medium' : 'threat-low'
                        }`}>
                          <p className="text-xs font-medium text-white">{event.time}</p>
                          <p className="text-sm text-slate-200 mt-1">{event.event}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Time Labels */}
                    <div className="absolute bottom-8 left-8 right-8 flex justify-between text-sm text-slate-400">
                      <span>09:00</span>
                      <span>09:30</span>
                      <span>10:00</span>
                      <span>10:30</span>
                      <span>11:00</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anomaly" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Anomaly Detection Overlay</h3>
                  
                  <div className="relative bg-slate-900/50 rounded-lg p-8 h-96 cyber-grid">
                    {/* Base Image Placeholder */}
                    <div className="absolute inset-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded border border-slate-600">
                      <div className="p-4">
                        <p className="text-slate-400 text-sm">System Activity Heatmap</p>
                      </div>
                    </div>

                    {/* Anomaly Regions */}
                    {anomalyRegions.map((region, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ delay: index * 0.3 }}
                        className={`absolute border-2 border-dashed rounded cursor-pointer ${
                          region.intensity === 'high' ? 'border-red-400 bg-red-500/20' :
                          region.intensity === 'medium' ? 'border-yellow-400 bg-yellow-500/20' :
                          'border-green-400 bg-green-500/20'
                        }`}
                        style={{
                          left: region.x,
                          top: region.y,
                          width: region.width,
                          height: region.height
                        }}
                        onClick={() => handleVisualizationAction(`Anomaly region ${index + 1}`)}
                      >
                        <div className="absolute -top-6 left-0">
                          <span className={`text-xs px-2 py-1 rounded ${
                            region.intensity === 'high' ? 'bg-red-500 text-white' :
                            region.intensity === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-green-500 text-white'
                          }`}>
                            {region.intensity.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {/* Legend */}
                    <div className="absolute top-4 right-4 p-3 bg-slate-800/80 rounded-lg">
                      <p className="text-white font-medium mb-2">Anomaly Intensity</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-400 rounded"></div>
                          <span className="text-slate-300">High</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                          <span className="text-slate-300">Medium</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded"></div>
                          <span className="text-slate-300">Low</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Visualization Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 glass-effect border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Visualization Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="border-blue-500/30 hover:bg-blue-500/10"
                onClick={() => handleVisualizationAction('Zoom In')}
              >
                Zoom In
              </Button>
              <Button
                variant="outline"
                className="border-purple-500/30 hover:bg-purple-500/10"
                onClick={() => handleVisualizationAction('Reset View')}
              >
                Reset View
              </Button>
              <Button
                variant="outline"
                className="border-green-500/30 hover:bg-green-500/10"
                onClick={() => handleVisualizationAction('Auto Refresh')}
              >
                Auto Refresh
              </Button>
              <Button
                variant="outline"
                className="border-red-500/30 hover:bg-red-500/10"
                onClick={() => handleVisualizationAction('Save Snapshot')}
              >
                Save Snapshot
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Visualizations;
