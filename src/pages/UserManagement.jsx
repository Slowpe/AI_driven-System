import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  Settings,
  Clock,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0, analysts: 0 });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('vistaCurrentUser'));
    if (storedUser) {
        const generateCompanyUsers = (loggedInUser) => {
            const firstNames = ['Bisi', 'Emeka', 'Aisha', 'Tunde', 'Ngozi', 'Yusuf'];
            const lastNames = ['Adeboye', 'Okafor', 'Bello', 'Sowore', 'Ibrahim', 'Lawal'];
            const roles = ['Security Analyst', 'IT Officer'];
            const companyDomain = loggedInUser.companyName.split(' ').join('').toLowerCase() + '.ng';

            const generatedUsers = Array.from({ length: 4 }, (_, i) => {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const role = roles[Math.floor(Math.random() * roles.length)];
                return {
                    id: i + 2,
                    name: `${firstName} ${lastName}`,
                    email: `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`,
                    role: role,
                    status: Math.random() > 0.3 ? 'active' : 'inactive',
                    lastLogin: `${Math.floor(Math.random() * 24) + 1} hours ago`,
                    loginHistory: Math.floor(Math.random() * 50),
                    avatar: `${firstName[0]}${lastName[0]}`.toUpperCase()
                };
            });

            return [
                {
                    id: 1,
                    name: loggedInUser.fullName,
                    email: loggedInUser.email,
                    role: 'Admin',
                    status: 'active',
                    lastLogin: 'Just now',
                    loginHistory: Math.floor(Math.random() * 10) + 15,
                    avatar: loggedInUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                },
                ...generatedUsers
            ];
        };
        setUsers(generateCompanyUsers(storedUser));
    }
  }, []);

  useEffect(() => {
      if (users.length === 0) return;
      const interval = setInterval(() => {
          setUsers(prevUsers => {
              const userToUpdateIndex = Math.floor(Math.random() * (prevUsers.length -1)) + 1; // Don't change admin
              const userToUpdate = prevUsers[userToUpdateIndex];

              if (!userToUpdate) return prevUsers;

              return prevUsers.map(u => 
                  u.id === userToUpdate.id 
                  ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
                  : u
              );
          });
      }, 5000);
      return () => clearInterval(interval);
  }, [users.length]);

  useEffect(() => {
      setStats({
          total: users.length,
          active: users.filter(u => u.status === 'active').length,
          admins: users.filter(u => u.role === 'Admin').length,
          analysts: users.filter(u => u.role === 'Security Analyst').length,
      });
  }, [users]);


  const roleColors = {
    'Admin': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Security Analyst': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'IT Officer': 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  const statusColors = {
    'active': 'bg-green-500/20 text-green-400 border-green-500/30',
    'inactive': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const handleUserAction = (action, userName) => {
    toast({
      title: `Action: ${action}`,
      description: `This feature isn't implemented yet for ${userName}—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>User Management - VISTA</title>
        <meta name="description" content="Manage user roles, permissions, and access for your company." />
      </Helmet>
      
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
              <p className="text-slate-400">Manage your company's users, roles, and permissions.</p>
            </div>
            <Button onClick={() => handleUserAction('Add User', '')} className="mt-4 lg:mt-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite New User
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-primary">Total Users</CardTitle>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-primary">Active Users</CardTitle>
                        <UserCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.active}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-primary">Admins</CardTitle>
                        <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.admins}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-primary">Analysts</CardTitle>
                        <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.analysts}</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Company Directory</CardTitle>
                     <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" onClick={() => handleUserAction('Filter', '')}>
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {filteredUsers.map((user, index) => (
                    <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-white">{user.avatar}</span>
                        </div>
                        <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4">
                        <div className="text-center">
                            <Badge className={roleColors[user.role]}>{user.role}</Badge>
                        </div>

                        <div className="text-center">
                           <Badge className={statusColors[user.status]}>{user.status}</Badge>
                        </div>

                        <div className="text-center min-w-[100px] hidden lg:block">
                            <div className="flex items-center justify-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-slate-300">{user.lastLogin}</p>
                            </div>
                            <p className="text-xs text-slate-500">{user.loginHistory} logins</p>
                        </div>

                        <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleUserAction('View Profile', user.name)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleUserAction('Edit User', user.name)}>
                            <Settings className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    </motion.div>
                ))}
                </div>
                 {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No users found matching your search.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserManagement;