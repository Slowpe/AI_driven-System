import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ResponsiveChart from '@/components/ResponsiveChart';
import { Map, AlertOctagon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const initialNetworkIntrusionData = [
  { country: 'Nigeria', intrusions: 120, severity: 8 },
  { country: 'USA', intrusions: 80, severity: 6 },
  { country: 'China', intrusions: 150, severity: 9 },
  { country: 'Russia', intrusions: 110, severity: 8.5 },
  { country: 'Brazil', intrusions: 60, severity: 5 },
];


const VisualizationInsights = () => {
    const { toast } = useToast();
    const [networkData, setNetworkData] = useState(initialNetworkIntrusionData);

    useEffect(() => {
        const interval = setInterval(() => {
            setNetworkData(prevData =>
                prevData.map(item => ({
                    ...item,
                    intrusions: Math.max(20, item.intrusions + Math.floor(Math.random() * 20) - 10),
                    severity: parseFloat(Math.min(10, Math.max(4, item.severity + (Math.random() - 0.5))).toFixed(1)),
                }))
            );
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const handleFeatureClick = () => {
        toast({
            title: "🚧 Feature In Progress",
            description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    }

  return (
    <>
      <Helmet>
        <title>VISTA - Visualization Insights</title>
        <meta name="description" content="Interactive threat visualizations, including network intrusion maps and threat progression timelines." />
      </Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Visualization Insights</h1>
        <div className="grid gap-8 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Map className="w-6 h-6 text-primary" />
                        <CardTitle>Network Intrusion Map</CardTitle>
                    </div>
                    <CardDescription>Simulated global threat origins and targets. Click map for details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full h-96 bg-secondary/30 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer" onClick={handleFeatureClick}>
                        <img  alt="World map with connection lines" className="absolute w-full h-full object-cover opacity-20" src="https://images.unsplash.com/photo-1585858229735-cd08d8cb510d" />
                        <div className="z-10 text-center">
                            <h3 className="text-2xl font-bold text-white">Interactive Map Placeholder</h3>
                            <p className="text-muted-foreground">D3.js integration in development.</p>
                        </div>
                        <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse-slow"></div>
                        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Threat Progression Timeline</CardTitle>
                    <CardDescription>Volume and severity of threats over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveChart>
                        <ComposedChart data={networkData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="country" stroke="hsl(var(--muted-foreground))" />
                            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" label={{ value: 'Intrusions', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}/>
                            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--primary))" domain={[0,12]} label={{ value: 'Severity', angle: 90, position: 'insideRight', fill: 'hsl(var(--primary))' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend />
                            <Bar yAxisId="left" dataKey="intrusions" barSize={20} fill="hsl(var(--secondary-foreground))" />
                            <Line yAxisId="right" type="monotone" dataKey="severity" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveChart>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertOctagon className="w-6 h-6 text-destructive" />
                        <CardTitle>Visual Anomaly Overlays</CardTitle>
                    </div>
                    <CardDescription>Highlighted regions of interest in visual logs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full h-64 bg-secondary/30 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer" onClick={handleFeatureClick}>
                        <img  alt="Malware heatmap visualization" className="absolute w-full h-full object-cover opacity-70" src="https://images.unsplash.com/photo-1601207812147-c66de654658d" />
                         <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-4 border-destructive rounded-md animate-pulse"></div>
                        <div className="z-10 p-2 bg-black/50 rounded-md">
                            <h3 className="font-bold text-white">Anomalous Code Block</h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
};

export default VisualizationInsights;