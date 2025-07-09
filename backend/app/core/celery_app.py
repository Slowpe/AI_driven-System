from celery import Celery
from app.core.config import settings
import structlog

logger = structlog.get_logger()

# Create Celery instance
celery_app = Celery(
    "vista",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.tasks.analysis_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
)

# Task routing
celery_app.conf.task_routes = {
    'app.tasks.analysis_tasks.*': {'queue': 'analysis'},
    'app.tasks.notification_tasks.*': {'queue': 'notifications'},
}

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks"""
    # Add periodic tasks here if needed
    pass

@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing"""
    logger.info(f'Request: {self.request!r}')
    return "Debug task completed" 