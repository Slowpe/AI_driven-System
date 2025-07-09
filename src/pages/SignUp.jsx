import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, User, Mail, Building, Lock, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, setAuthToken } from '@/lib/api';

const SignUp = ({ onSignUp }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { companyName, fullName, email, password } = formData;

    if (!companyName || !fullName || !email || !password) {
      toast({
        title: 'All fields are required',
        description: 'Please fill out the entire form.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
        toast({
            title: 'Password too short',
            description: 'Password must be at least 8 characters long.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);

    try {
      // Call the FastAPI backend registration
      const userData = {
        email,
        password,
        full_name: fullName,
        company_name: companyName,
      };

      const response = await authAPI.register(userData);
      
      // Auto-login after successful registration
      const loginResponse = await authAPI.login(email, password);
      setAuthToken(loginResponse.access_token);
      
      toast({
        title: 'Account Created!',
        description: `Welcome to VISTA, ${fullName}! Your account has been successfully created.`,
      });

      onSignUp();
      navigate('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - VISTA</title>
        <meta name="description" content="Create a new company account for VISTA." />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <Eye className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-bold text-white">VISTA</h1>
              </div>
              <CardTitle className="text-2xl">Create Your Company Account</CardTitle>
              <CardDescription>
                Join VISTA to enhance your cybersecurity infrastructure.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="companyName" 
                      placeholder="e.g., Acme Corporation" 
                      className="pl-10" 
                      value={formData.companyName} 
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})} 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="fullName" 
                      placeholder="e.g., John Doe" 
                      className="pl-10" 
                      value={formData.fullName} 
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="e.g., admin@yourcompany.com" 
                      className="pl-10" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="8+ characters" 
                      className="pl-10 pr-10" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      required 
                      disabled={isLoading}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign In
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SignUp;