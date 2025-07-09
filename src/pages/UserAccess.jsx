import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const initialLoginHistory = [
  { id: 1, user: 'analyst@bank.ng', role: 'Security Analyst', ip: '197.210.65.10', time: '2025-06-20 10:30 AM', status: 'Success' },
  { id: 2, user: 'it-officer@bank.ng', role: 'IT Officer', ip: '102.89.33.25', time: '2025-06-20 09:15 AM', status: 'Success' },
  { id: 3, user: 'admin@bank.ng', role: 'Admin', ip: '197.210.22.5', time: '2025-06-19 18:00 PM', status: 'Success' },
  { id: 4, user: 'hacker@evil.com', role: 'N/A', ip: '203.0.113.199', time: '2025-06-19 17:55 PM', status: 'Failed' },
];

const UserAccess = () => {
    const { toast } = useToast();
    const [history, setHistory] = useState(initialLoginHistory);

    useEffect(() => {
        const interval = setInterval(() => {
            const roles = ['Security Analyst', 'IT Officer', 'Admin', 'N/A'];
            const newUser = 'user' + Math.floor(Math.random() * 100) + '@bank.ng';
            const newIp = [...(Array(4))].map(() => Math.floor(Math.random() * 255)).join('.');
            const newStatus = Math.random() > 0.3 ? 'Success' : 'Failed';
            const newRole = newStatus === 'Failed' ? 'N/A' : roles[Math.floor(Math.random()*3)];

            const newEntry = {
                id: Date.now(),
                user: newStatus === 'Failed' ? 'unknown@system' : newUser,
                role: newRole,
                ip: newIp,
                time: new Date().toLocaleTimeString('en-US'),
                status: newStatus,
            };
            setHistory(prev => [newEntry, ...prev].slice(0, 10));
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    const handleAuthAction = (e) => {
        e.preventDefault();
        toast({
            title: "🚧 Authentication In Progress",
            description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    }

  return (
    <>
      <Helmet>
        <title>VISTA - User Access Management</title>
        <meta name="description" content="Manage user access with a role-based login and registration system." />
      </Helmet>
      <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center">User Access Management</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="md:col-span-2">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleAuthAction}>
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Enter your credentials to access the system.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="user@bank.ng" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input id="login-password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full">Sign In</Button>
                    </CardContent>
                </form>
              </TabsContent>
              <TabsContent value="register">
                 <form onSubmit={handleAuthAction}>
                    <CardHeader>
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Register a new user for system access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input id="reg-email" type="email" placeholder="new.user@bank.ng" required />
                        </div>
                         <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input id="reg-password" type="password" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select required>
                            <SelectTrigger id="role">
                            <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="analyst">Security Analyst</SelectItem>
                            <SelectItem value="it_officer">IT Officer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <Button type="submit" className="w-full">Register</Button>
                    </CardContent>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recent Login History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => (
                            <motion.tr 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <TableCell className="font-medium">{item.user}</TableCell>
                                <TableCell>{item.role}</TableCell>
                                <TableCell>{item.ip}</TableCell>
                                <TableCell>{item.time}</TableCell>
                                <TableCell className="text-right">
                                    <span className={item.status === 'Success' ? 'text-green-400' : 'text-red-500'}>{item.status}</span>
                                </TableCell>
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

export default UserAccess;