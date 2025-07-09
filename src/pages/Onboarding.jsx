import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [apiUrl, setApiUrl] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!apiUrl.trim()) {
      toast({
        title: 'API URL Required',
        description: 'Please enter a valid backend API URL.',
        variant: 'destructive',
      });
      return;
    }
    try {
      new URL(apiUrl);
    } catch (_) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL format (e.g., https://api.example.com).',
        variant: 'destructive',
      });
      return;
    }

    localStorage.setItem('vistaApiUrl', apiUrl);
    toast({
      title: 'Connection Successful!',
      description: 'Successfully connected to your backend API.',
    });
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Connect API - VISTA</title>
        <meta name="description" content="Connect your backend API to VISTA." />
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
              <CardTitle className="text-2xl">One Last Step!</CardTitle>
              <CardDescription>
                Connect VISTA to your system. Please provide your backend API URL to start monitoring logs.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="api-url">Backend API URL</Label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="api-url" 
                        placeholder="https://api.yourcompany.com/logs" 
                        className="pl-10"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Connect & Finish Setup</Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Onboarding;