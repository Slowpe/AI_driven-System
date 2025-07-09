import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import ResponsiveChart from '@/components/ResponsiveChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Layers, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const initialBertAttentionData = [
  { token: 'login', attention: 0.9 },
  { token: 'failed', attention: 0.85 },
  { token: 'from', attention: 0.2 },
  { token: 'ip', attention: 0.7 },
  { token: '192.168.1.100', attention: 0.8 },
  { token: 'multiple', attention: 0.75 },
  { token: 'times', attention: 0.6 },
];

const Explainability = () => {
    const { toast } = useToast();
    const [auditLogs, setAuditLogs] = useState([]);
    const [user, setUser] = useState(null);
    const [bertData, setBertData] = useState(initialBertAttentionData);

    const generateAuditLogs = (currentUser) => {
        return [
            { id: 1, action: 'File Analysis', user: currentUser.email, details: 'Analyzed security_log_alpha.txt, no threats found.', timestamp: '2025-06-20 11:05:18' },
            { id: 2, action: 'User Login', user: 'admin@' + currentUser.companyName.split(' ')[0].toLowerCase() + '.com', details: 'Successful login from IP 197.210.22.5', timestamp: '2025-06-20 10:45:12' },
            { id: 3, action: 'Trigger Analysis', user: currentUser.email, details: 'Triggered multimodal analysis on 2 files.', timestamp: '2025-06-20 10:42:55' },
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    useEffect(() => {
        const storedUser = localStorage.getItem('vistaCurrentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setAuditLogs(generateAuditLogs(parsedUser));
        }

        const interval = setInterval(() => {
            setBertData(prevData =>
                prevData.map(item => ({ ...item, attention: parseFloat(Math.max(0.1, Math.min(0.95, item.attention + (Math.random() - 0.5) * 0.2)).toFixed(2)) }))
            );

            const actions = ['File Analysis', 'Policy Update', 'User Logout', 'System Scan'];
            const users = ['system', user?.email, 'analyst@' + user?.companyName.split(' ')[0].toLowerCase() + '.com'].filter(Boolean);
            const newLog = {
                id: Date.now(),
                action: actions[Math.floor(Math.random() * actions.length)],
                user: users[Math.floor(Math.random() * users.length)],
                details: `Automatic system event occurred.`,
                timestamp: new Date().toLocaleTimeString('en-US'),
            };
            setAuditLogs(prev => [newLog, ...prev].slice(0, 7));

        }, 4000);

        return () => clearInterval(interval);

    }, [user?.email, user?.companyName]);


    const handleDownload = () => {
        toast({
            title: "Download Starting",
            description: "Your compliance report is being generated.",
        });
    }

  return (
    <>
      <Helmet>
        <title>VISTA - Explainability & Audit Logs</title>
        <meta name="description" content="View interpretable AI results, audit trails, and download compliance reports." />
      </Helmet>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white">Explainability & Audit Logs</h1>
                <p className="text-muted-foreground">Understand AI decisions and track system activity.</p>
            </div>
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Compliance Report
            </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ShieldQuestion className="w-6 h-6 text-primary" />
                        <CardTitle>BERT Attention Focus</CardTitle>
                    </div>
                    <CardDescription>Mock visualization of keywords the text model focused on.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveChart>
                        <BarChart data={bertData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="token" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 1]}/>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend />
                            <Bar dataKey="attention" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveChart>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Layers className="w-6 h-6 text-primary" />
                        <CardTitle>ResNet Salient Regions</CardTitle>
                    </div>
                    <CardDescription>Highlighted image regions from the visual model.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full h-[288px] bg-secondary/30 rounded-lg flex items-center justify-center overflow-hidden">
                        <img  alt="Malware binary visualization" className="absolute w-full h-full object-contain opacity-50" src="https://images.unsplash.com/photo-1601207812147-c66de654658d" />
                        <div className="absolute top-[20%] left-[15%] w-[30%] h-[40%] border-2 border-yellow-400 rounded-sm bg-yellow-400/20 animate-pulse"></div>
                        <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[25%] border-2 border-red-500 rounded-sm bg-red-500/20 animate-pulse-slow"></div>
                        <p className="z-10 text-lg font-semibold text-white bg-black/50 p-2 rounded-md">Critical Feature Regions</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Live Audit Trail</CardTitle>
                <CardDescription>A log of all significant actions performed within the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {auditLogs.map((log) => (
                           <motion.tr 
                                key={log.id}
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <TableCell className="font-semibold">{log.action}</TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell className="text-muted-foreground">{log.details}</TableCell>
                                <TableCell className="text-right">{log.timestamp}</TableCell>
                           </motion.tr>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Explainability;