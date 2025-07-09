import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pause, Play, Search, X } from 'lucide-react';
import { useLiveMonitor } from '@/contexts/LiveMonitorContext';

const LiveMonitor = () => {
  const logContainerRef = useRef(null);
  const {
    logs,
    isPaused,
    setIsPaused,
    filter,
    setFilter
  } = useLiveMonitor();

  React.useEffect(() => {
    if (logContainerRef.current && !isPaused) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(filter.toLowerCase()) ||
    (log.anomaly && log.anomaly.label.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <>
      <Helmet>
        <title>VISTA - Live Monitor</title>
        <meta name="description" content="Real-time monitoring of system logs with anomaly detection." />
      </Helmet>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <CardHeader className="flex-shrink-0 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Live System Log Monitor</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter logs..." 
                  className="pl-10"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setFilter('')}/>} 
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <div 
            ref={logContainerRef}
            className="h-full overflow-y-auto bg-black/50 rounded-b-xl p-4 font-mono text-xs"
          >
            <AnimatePresence initial={false}>
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-4 p-1 rounded transition-colors hover:bg-white/10",
                    log.anomaly && 'font-bold'
                  )}
                >
                  <span className="text-muted-foreground/50 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <p className={cn("flex-1", log.anomaly ? log.anomaly.color : 'text-gray-300')}>
                    {log.message}
                    {log.anomaly && <span className="ml-4 p-1 rounded bg-red-900/50 text-red-300 text-[10px]">{log.anomaly.label}</span>}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </div>
    </>
  );
};

export default LiveMonitor;