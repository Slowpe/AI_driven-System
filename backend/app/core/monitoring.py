from prometheus_client import start_http_server, Counter, Histogram, Gauge
import structlog
from typing import Optional
from app.core.config import settings

logger = structlog.get_logger()

# Define metrics
ANALYSIS_REQUESTS = Counter('vista_analysis_requests_total', 'Total analysis requests', ['type', 'status'])
ANALYSIS_DURATION = Histogram('vista_analysis_duration_seconds', 'Analysis duration', ['type'])
THREAT_DETECTIONS = Counter('vista_threat_detections_total', 'Total threat detections', ['severity', 'type'])
ACTIVE_USERS = Gauge('vista_active_users', 'Number of active users')
SYSTEM_MEMORY = Gauge('vista_system_memory_bytes', 'System memory usage')
SYSTEM_CPU = Gauge('vista_system_cpu_percent', 'System CPU usage')

def setup_monitoring():
    """Setup Prometheus monitoring"""
    try:
        if settings.ENVIRONMENT != "test":
            start_http_server(settings.PROMETHEUS_PORT)
            logger.info(f"Prometheus metrics server started on port {settings.PROMETHEUS_PORT}")
    except Exception as e:
        logger.error("Failed to start Prometheus server", error=str(e))

def record_analysis_request(analysis_type: str, status: str, duration: Optional[float] = None):
    """Record analysis request metrics"""
    ANALYSIS_REQUESTS.labels(type=analysis_type, status=status).inc()
    if duration is not None:
        ANALYSIS_DURATION.labels(type=analysis_type).observe(duration)

def record_threat_detection(severity: str, threat_type: str):
    """Record threat detection metrics"""
    THREAT_DETECTIONS.labels(severity=severity, type=threat_type).inc()

def update_active_users(count: int):
    """Update active users gauge"""
    ACTIVE_USERS.set(count)

def update_system_metrics(memory_bytes: float, cpu_percent: float):
    """Update system metrics"""
    SYSTEM_MEMORY.set(memory_bytes)
    SYSTEM_CPU.set(cpu_percent) 