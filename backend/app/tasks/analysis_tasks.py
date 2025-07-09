from celery import current_task
from typing import Dict, List, Any
import structlog
import time

from app.core.celery_app import celery_app
from app.ml.models.ensemble_analyzer import EnsembleAnalyzer
from app.ml.models.text_analyzer import TextAnalyzer
from app.ml.models.visual_analyzer import VisualAnalyzer
from app.core.monitoring import record_analysis_request, record_threat_detection

logger = structlog.get_logger()

@celery_app.task(bind=True)
def analyze_text_task(self, text_data: str, user_id: int = None) -> Dict[str, Any]:
    """Background task for text analysis"""
    start_time = time.time()
    
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'status': 'Analyzing text...'})
        
        # Initialize analyzer
        analyzer = TextAnalyzer()
        
        # Perform analysis
        result = analyzer.predict(text_data)
        
        # Record metrics
        duration = time.time() - start_time
        record_analysis_request('text', 'success', duration)
        
        if result['prediction'] == 'malicious':
            record_threat_detection(result['severity'], 'text')
        
        return {
            'status': 'success',
            'result': result,
            'duration': duration,
            'user_id': user_id
        }
        
    except Exception as e:
        duration = time.time() - start_time
        record_analysis_request('text', 'error', duration)
        logger.error("Text analysis task failed", error=str(e))
        
        return {
            'status': 'error',
            'error': str(e),
            'duration': duration,
            'user_id': user_id
        }

@celery_app.task(bind=True)
def analyze_image_task(self, image_data: bytes, user_id: int = None) -> Dict[str, Any]:
    """Background task for image analysis"""
    start_time = time.time()
    
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'status': 'Analyzing image...'})
        
        # Initialize analyzer
        analyzer = VisualAnalyzer()
        
        # Perform analysis
        result = analyzer.predict(image_data)
        
        # Record metrics
        duration = time.time() - start_time
        record_analysis_request('image', 'success', duration)
        
        if result['prediction'] == 'malicious':
            record_threat_detection(result['severity'], 'image')
        
        return {
            'status': 'success',
            'result': result,
            'duration': duration,
            'user_id': user_id
        }
        
    except Exception as e:
        duration = time.time() - start_time
        record_analysis_request('image', 'error', duration)
        logger.error("Image analysis task failed", error=str(e))
        
        return {
            'status': 'error',
            'error': str(e),
            'duration': duration,
            'user_id': user_id
        }

@celery_app.task(bind=True)
def analyze_ensemble_task(self, text_data: str = None, image_data: bytes = None, 
                         user_id: int = None) -> Dict[str, Any]:
    """Background task for ensemble analysis"""
    start_time = time.time()
    
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'status': 'Running ensemble analysis...'})
        
        # Initialize analyzer
        analyzer = EnsembleAnalyzer()
        
        # Perform analysis
        result = analyzer.predict(text_data, image_data)
        
        # Record metrics
        duration = time.time() - start_time
        record_analysis_request('ensemble', 'success', duration)
        
        if result['prediction'] == 'malicious':
            record_threat_detection(result['severity'], 'ensemble')
        
        return {
            'status': 'success',
            'result': result,
            'duration': duration,
            'user_id': user_id
        }
        
    except Exception as e:
        duration = time.time() - start_time
        record_analysis_request('ensemble', 'error', duration)
        logger.error("Ensemble analysis task failed", error=str(e))
        
        return {
            'status': 'error',
            'error': str(e),
            'duration': duration,
            'user_id': user_id
        }

@celery_app.task(bind=True)
def batch_analysis_task(self, data_list: List[Dict[str, Any]], 
                       user_id: int = None) -> Dict[str, Any]:
    """Background task for batch analysis"""
    start_time = time.time()
    
    try:
        total_items = len(data_list)
        processed = 0
        
        # Update task state
        self.update_state(
            state='PROGRESS', 
            meta={'status': f'Processing batch of {total_items} items...', 'processed': 0}
        )
        
        # Initialize analyzer
        analyzer = EnsembleAnalyzer()
        
        results = []
        
        for item in data_list:
            try:
                # Perform analysis
                result = analyzer.predict(
                    text_data=item.get('text'),
                    image_data=item.get('image')
                )
                
                results.append({
                    'id': item.get('id'),
                    'result': result,
                    'status': 'success'
                })
                
                # Record threat if detected
                if result['prediction'] == 'malicious':
                    record_threat_detection(result['severity'], 'batch')
                    
            except Exception as e:
                results.append({
                    'id': item.get('id'),
                    'result': None,
                    'status': 'error',
                    'error': str(e)
                })
            
            processed += 1
            
            # Update progress
            if processed % 10 == 0:  # Update every 10 items
                self.update_state(
                    state='PROGRESS',
                    meta={
                        'status': f'Processed {processed}/{total_items} items...',
                        'processed': processed,
                        'total': total_items
                    }
                )
        
        # Record metrics
        duration = time.time() - start_time
        record_analysis_request('batch', 'success', duration)
        
        return {
            'status': 'success',
            'results': results,
            'total_processed': processed,
            'duration': duration,
            'user_id': user_id
        }
        
    except Exception as e:
        duration = time.time() - start_time
        record_analysis_request('batch', 'error', duration)
        logger.error("Batch analysis task failed", error=str(e))
        
        return {
            'status': 'error',
            'error': str(e),
            'duration': duration,
            'user_id': user_id
        }

@celery_app.task(bind=True)
def train_model_task(self, training_data: List[Dict[str, Any]], 
                    model_type: str = 'ensemble') -> Dict[str, Any]:
    """Background task for model training"""
    start_time = time.time()
    
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'status': 'Training model...'})
        
        if model_type == 'ensemble':
            analyzer = EnsembleAnalyzer()
        elif model_type == 'text':
            analyzer = TextAnalyzer()
        elif model_type == 'visual':
            analyzer = VisualAnalyzer()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Train model
        analyzer.train(training_data)
        
        # Record metrics
        duration = time.time() - start_time
        
        return {
            'status': 'success',
            'model_type': model_type,
            'training_samples': len(training_data),
            'duration': duration
        }
        
    except Exception as e:
        duration = time.time() - start_time
        logger.error("Model training task failed", error=str(e))
        
        return {
            'status': 'error',
            'error': str(e),
            'model_type': model_type,
            'duration': duration
        } 