import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, ShieldAlert, FileText, FileImage as ImageIcon, BrainCircuit, Bot, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const ThreatAnalyzer = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
        setProgress(prev => {
            const newProgress = prev + Math.random() * 20;
            if (newProgress >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return newProgress;
        });
    }, 400);

    toast({ title: 'Analyzing...', description: 'Please wait while we process the data.' });
    
    setTimeout(() => {
        const isThreat = Math.random() > 0.3;
        const bertScore = Math.floor(Math.random() * 30) + 70;
        const resnetScore = Math.floor(Math.random() * 30) + 65;
        const overallScore = Math.round((bertScore + resnetScore) / 2 + (Math.random() * 10 - 5));

      setAnalysisResult({
        overall: { status: isThreat ? 'Threat Detected' : 'Safe', score: overallScore },
        bert: { score: bertScore },
        resnet: { score: resnetScore },
        randomForest: { decision: isThreat ? 'Threat' : 'Safe' },
      });
      setIsAnalyzing(false);

      toast({ 
        title: 'Analysis Complete!',
        description: isThreat ? 'Threat detected with high confidence.' : 'No threats found.', 
        variant: isThreat ? "destructive" : "default" 
      });
    }, 2500);
  };
  
  const handleFeatureClick = () => {
    toast({
      title: "🚧 Feature In Progress",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  }

  const AnalysisInProgress = () => (
    <Card className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <h2 className="mt-4 text-xl font-semibold">Analyzing Data...</h2>
        <p className="mt-2 text-muted-foreground">The AI models are processing the logs.</p>
        <Progress value={progress} className="w-full max-w-sm mt-6 h-4" />
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>VISTA - Multimodal Threat Analyzer</title>
        <meta name="description" content="Trigger analysis and view AI detection results from VISTA's multimodal models." />
      </Helmet>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white">Multimodal Threat Analyzer</h1>
                <p className="text-muted-foreground">Trigger analysis on uploaded logs and view detailed results.</p>
            </div>
            <Button onClick={handleAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing...' : 'Trigger Analysis'}
            </Button>
        </div>

        {isAnalyzing ? <AnalysisInProgress /> : analysisResult ? (
          <Tabs defaultValue="multimodal" className="w-full">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="multimodal">Multimodal View</TabsTrigger>
                <TabsTrigger value="unimodal">Unimodal View</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Switch id="live-mode" onClick={handleFeatureClick}/>
                <Label htmlFor="live-mode">Live Analysis</Label>
              </div>
            </div>
            <TabsContent value="multimodal">
              <Card>
                <CardHeader>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-4"
                  >
                    {analysisResult.overall.status === 'Threat Detected' ? <ShieldAlert className="h-10 w-10 text-destructive" /> : <ShieldCheck className="h-10 w-10 text-green-500" />}
                    <div>
                      <CardTitle className="text-3xl">
                        {analysisResult.overall.status}
                      </CardTitle>
                      <CardDescription>
                        Overall Confidence Score: {analysisResult.overall.score}%
                      </CardDescription>
                    </div>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={analysisResult.overall.score} className="h-6" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-secondary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">BERT (Text)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>Confidence: {analysisResult.bert.score}%</p>
                        <Progress value={analysisResult.bert.score} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card className="bg-secondary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">ResNet (Visual)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>Confidence: {analysisResult.resnet.score}%</p>
                        <Progress value={analysisResult.resnet.score} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card className="bg-secondary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">Random Forest</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>Combined Decision: <span className={`font-bold ${analysisResult.randomForest.decision === 'Threat' ? 'text-destructive' : 'text-green-400'}`}>{analysisResult.randomForest.decision}</span></p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="unimodal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                      <CardHeader>
                          <div className="flex items-center gap-3"><FileText className="w-7 h-7 text-primary" /> <CardTitle>Text Analysis</CardTitle></div>
                          <CardDescription>Results from BERT model</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">Confidence: {analysisResult.bert.score}%</p>
                        <Progress value={analysisResult.bert.score} className="mt-2 h-5" />
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <div className="flex items-center gap-3"><ImageIcon className="w-7 h-7 text-primary" /> <CardTitle>Visual Analysis</CardTitle></div>
                          <CardDescription>Results from ResNet model</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">Confidence: {analysisResult.resnet.score}%</p>
                        <Progress value={analysisResult.resnet.score} className="mt-2 h-5" />
                      </CardContent>
                  </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed">
            <Bot className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Awaiting Analysis</h2>
            <p className="mt-2 text-muted-foreground">Click "Trigger Analysis" to start processing the uploaded data.</p>
          </Card>
        )}
      </div>
    </>
  );
};

export default ThreatAnalyzer;