import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UploadCloud, 
  FileText, 
  FileImage as ImageIcon, 
  XCircle, 
  CheckCircle, 
  Loader2, 
  Play, 
  Shield, 
  Zap,
  File,
  Folder,
  AlertCircle,
  Info,
  Sparkles,
  Eye,
  Brain,
  BarChart3,
  Clock,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { logsAPI } from '../lib/api';

const LogUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState('text');
  const [uploadMode, setUploadMode] = useState('file');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const { toast } = useToast();
  const [textFiles, setTextFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [showTips, setShowTips] = useState(true);

  // Auto-hide tips after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTips(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const uploadFile = async (file, type) => {
    try {
      const fileSizeGB = file.size / (1024 * 1024 * 1024);
      
      if (fileSizeGB > 1) {
        return await logsAPI.uploadStreaming(file, type, (progress, loaded, total) => {
          setUploadProgress(progress);
          const speed = loaded / (Date.now() / 1000);
          setUploadSpeed(speed);
          setTimeRemaining((total - loaded) / speed);
        });
      } else if (file.size > 50 * 1024 * 1024) {
        return await logsAPI.uploadChunked(file, type);
      } else {
        return await logsAPI.uploadLog(file, type);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Upload failed');
    }
  };

  const uploadFolder = async (files, type) => {
    try {
      const response = await logsAPI.uploadFolder(files, type);
      return response;
    } catch (error) {
      console.error('Folder upload error:', error);
      throw new Error(error.message || 'Folder upload failed');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);

    try {
      if (uploadMode === 'file') {
        const file = files[0];
        setCurrentFile(file);
        const fileSizeGB = file.size / (1024 * 1024 * 1024);
        
        setUploadProgress(5);
        
        let uploadMethod = "regular upload";
        if (fileSizeGB > 1) {
          uploadMethod = "streaming upload";
          toast({
            title: "🚀 Large File Detected",
            description: `${file.name} (${formatFileSize(file.size)}) will use streaming upload for optimal performance.`,
          });
        } else if (file.size > 50 * 1024 * 1024) {
          uploadMethod = "chunked upload";
          toast({
            title: "⚡ Large File Detected",
            description: `${file.name} (${formatFileSize(file.size)}) will use chunked upload for better performance.`,
          });
        }
        
        const result = await uploadFile(file, uploadType);
        
        setUploadProgress(100);
        toast({
          title: "✅ Upload Successful",
          description: `${file.name} uploaded successfully using ${uploadMethod}`,
        });
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const totalFiles = files.length;
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        
        const veryLargeFiles = files.filter(f => f.size > 1024 * 1024 * 1024);
        const largeFiles = files.filter(f => f.size > 50 * 1024 * 1024 && f.size <= 1024 * 1024 * 1024);
        
        if (veryLargeFiles.length > 0) {
          toast({
            title: "🚀 Very Large Files Detected",
            description: `${veryLargeFiles.length} files > 1GB will use streaming upload. Total: ${formatFileSize(totalSize)}`,
          });
        } else if (largeFiles.length > 0) {
          toast({
            title: "⚡ Large Files Detected",
            description: `${largeFiles.length} large files will use chunked upload for better performance.`,
          });
        }
        
        const result = await uploadFolder(files, uploadType);
        
        setUploadProgress(100);
        toast({
          title: "✅ Folder Upload Complete",
          description: `Uploaded ${result.total_uploaded} files (${formatFileSize(totalSize)}) successfully${result.total_failed > 0 ? `, ${result.total_failed} failed` : ''}`,
        });
        
        if (folderInputRef.current) {
          folderInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "❌ Upload Failed",
        description: error.message || "Failed to upload file(s)",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFile(null);
      setUploadSpeed(0);
      setTimeRemaining(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const event = { target: { files } };
      handleFileUpload(event);
    }
  };

  const FileStatusIcon = ({ status }) => {
    switch (status) {
      case 'Uploaded':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Uploading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'Analyzing':
        return <Play className="h-5 w-5 text-orange-500" />;
      case 'Error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const FileStatusText = ({ status }) => {
    switch (status) {
      case 'Uploaded':
        return <span className="text-xs font-semibold text-green-400">{status}</span>;
      case 'Uploading':
        return <span className="text-xs font-semibold text-blue-400">{status}</span>;
      case 'Analyzing':
        return <span className="text-xs font-semibold text-orange-400">{status}</span>;
      case 'Error':
        return <span className="text-xs font-semibold text-destructive">{status}</span>;
      default:
        return <span className="text-xs font-semibold text-yellow-400">{status}</span>;
    }
  };

  const FilePreview = ({ files, onRemove, type }) => (
    <div className="mt-4 space-y-2">
      {files.map(file => (
        <motion.div 
          key={file.id} 
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <FileStatusIcon status={file.status} />
            <div className="min-w-0">
              <span className="text-sm font-medium truncate block">{file.name}</span>
              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <FileStatusText status={file.status} />
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100" onClick={() => onRemove(file.id, type)}>
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const uploadedFilesCount = [...textFiles, ...imageFiles].filter(f => f.status === 'Uploaded').length;
  const hasFilesToAnalyze = uploadedFilesCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Upload Security Logs - VISTA AI</title>
        <meta name="description" content="Upload security logs for AI-powered threat analysis" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Upload Security Logs
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your security logs and files for advanced AI-powered threat analysis and detection
            </p>
          </div>

          {/* Tips Banner */}
          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 mb-6 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">💡 Pro Tips:</p>
                    <p className="text-sm opacity-90">
                      Drag & drop files directly, use chunked uploads for large files, and get real-time analysis results
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowTips(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Type Selection */}
          <Card className="mb-6 shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-400" />
                Choose Analysis Type
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Select the type of analysis you want to perform on your files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUploadType('text')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    uploadType === 'text'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                      : 'border-border hover:border-blue-400 hover:shadow-md bg-card'
                  }`}
                >
                  {uploadType === 'text' && (
                    <motion.div
                      layoutId="activeType"
                      className="absolute inset-0 bg-blue-500/10 rounded-xl"
                    />
                  )}
                  <div className="relative text-center">
                    <div className="text-4xl mb-3">📄</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Text Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Analyze log files, CSV, JSON, and text documents for security threats
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>Logs, CSV, JSON, XML, etc.</span>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUploadType('visual')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    uploadType === 'visual'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg'
                      : 'border-border hover:border-purple-400 hover:shadow-md bg-card'
                  }`}
                >
                  {uploadType === 'visual' && (
                    <motion.div
                      layoutId="activeType"
                      className="absolute inset-0 bg-purple-500/10 rounded-xl"
                    />
                  )}
                  <div className="relative text-center">
                    <div className="text-4xl mb-3">🖼️</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Visual Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Analyze images, screenshots, and visual content for security threats
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>Images, Screenshots, etc.</span>
                    </div>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Mode Selection */}
          <Card className="mb-6 shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                <UploadCloud className="h-6 w-6 text-green-400" />
                Upload Mode
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose how you want to upload your files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUploadMode('file')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    uploadMode === 'file'
                      ? 'border-green-500 bg-green-500/10 shadow-lg'
                      : 'border-border hover:border-green-400 hover:shadow-md bg-card'
                  }`}
                >
                  {uploadMode === 'file' && (
                    <motion.div
                      layoutId="activeMode"
                      className="absolute inset-0 bg-green-500/10 rounded-xl"
                    />
                  )}
                  <div className="relative text-center">
                    <div className="text-4xl mb-3">📁</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Single File</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload individual files one by one with detailed progress tracking
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <File className="h-3 w-3" />
                      <span>One file at a time</span>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUploadMode('folder')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    uploadMode === 'folder'
                      ? 'border-green-500 bg-green-500/10 shadow-lg'
                      : 'border-border hover:border-green-400 hover:shadow-md bg-card'
                  }`}
                >
                  {uploadMode === 'folder' && (
                    <motion.div
                      layoutId="activeMode"
                      className="absolute inset-0 bg-green-500/10 rounded-xl"
                    />
                  )}
                  <div className="relative text-center">
                    <div className="text-4xl mb-3">📂</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Multiple Files</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload multiple files at once for batch processing
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Folder className="h-3 w-3" />
                      <span>Batch upload</span>
                    </div>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-border hover:border-blue-400 hover:bg-accent/50'
                }`}
              >
                {isDragOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-500/10 rounded-xl"
                  />
                )}
                
                <motion.div
                  animate={{ scale: isDragOver ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-6xl mb-6"
                >
                  {isDragOver ? '📤' : '📁'}
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-3 text-white">
                  {isDragOver 
                    ? 'Drop your files here!' 
                    : uploadMode === 'file' 
                      ? 'Drop a file here' 
                      : 'Drop files here'
                  }
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  {uploadMode === 'file' 
                    ? 'or click to select a single file'
                    : 'or click to select multiple files'
                  }
                </p>
                
                <input
                  ref={uploadMode === 'file' ? fileInputRef : folderInputRef}
                  type="file"
                  multiple={uploadMode === 'folder'}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept={uploadType === 'text' 
                    ? '.txt,.log,.csv,.json,.xml,.html,.css,.js,.py,.sql,.md,.yaml,.yml,.pdf'
                    : '.jpg,.jpeg,.png,.gif,.bmp,.tiff'
                  }
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (uploadMode === 'file') {
                      fileInputRef.current?.click();
                    } else {
                      folderInputRef.current?.click();
                    }
                  }}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UploadCloud className="h-5 w-5" />
                      Choose Files
                    </div>
                  )}
                </motion.button>
              </motion.div>

              {/* Upload Progress */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 space-y-4"
                  >
                    {currentFile && (
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <File className="h-5 w-5 text-blue-400" />
                          <span className="font-medium text-white">{currentFile.name}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {formatFileSize(currentFile.size)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Upload Progress</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-3" />
                          
                          {uploadSpeed > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Speed: {formatFileSize(uploadSpeed)}/s</span>
                              {timeRemaining > 0 && (
                                <span>ETA: {formatTime(timeRemaining)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Fast Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms process your files quickly and efficiently
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Secure Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Your files are encrypted and processed securely
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI models detect threats and anomalies
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supported Formats */}
          <Card className="mt-8 shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <File className="h-5 w-5 text-blue-400" />
                Supported File Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    Text Analysis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['.txt', '.log', '.csv', '.json', '.xml', '.html', '.css', '.js', '.py', '.sql', '.md', '.yaml', '.yml', '.pdf'].map(format => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    Visual Analysis
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].map(format => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LogUpload;