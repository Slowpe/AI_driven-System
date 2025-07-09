from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import structlog
from datetime import datetime

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.database import User, SecurityLog, AnalysisResult, ThreatLevel
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisResultResponse,
    BatchAnalysisRequest
)
from app.services.analysis_service import AnalysisService
from app.services.log_processor import LogProcessor

logger = structlog.get_logger()
router = APIRouter()

@router.post("/trigger", response_model=AnalysisResponse)
async def trigger_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger analysis on uploaded logs"""
    try:
        # Get logs to analyze
        logs = db.query(SecurityLog).filter(
            SecurityLog.id.in_(request.log_ids),
            SecurityLog.user_id == current_user.id
        ).all()
        
        if not logs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No logs found for analysis"
            )
        
        # Initialize analysis service
        analysis_service = AnalysisService()
        
        # Create analysis response
        analysis_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{current_user.id}"
        
        # Add background task for analysis
        background_tasks.add_task(
            analysis_service.analyze_logs,
            logs,
            current_user.id,
            analysis_id,
            db
        )
        
        logger.info("Analysis triggered", 
                   analysis_id=analysis_id,
                   user_id=current_user.id,
                   log_count=len(logs))
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="processing",
            message="Analysis started in background",
            log_count=len(logs),
            estimated_time="2-5 minutes"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Analysis trigger failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to trigger analysis"
        )

@router.get("/status/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_status(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis status and results"""
    try:
        # Get analysis results
        results = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id
        ).all()
        
        # Filter by analysis_id if provided
        if analysis_id != "all":
            # This would need to be implemented based on how analysis_id is stored
            pass
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No analysis results found"
            )
        
        # Calculate statistics
        total_results = len(results)
        completed_results = len([r for r in results if r.processing_time is not None])
        avg_confidence = sum(r.confidence_score for r in results) / total_results if total_results > 0 else 0
        
        # Count threats by level
        threat_counts = {}
        for level in ThreatLevel:
            threat_counts[level.value] = len([r for r in results if r.prediction == level])
        
        logger.info("Analysis status retrieved", 
                   analysis_id=analysis_id,
                   user_id=current_user.id,
                   total_results=total_results)
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="completed" if completed_results == total_results else "processing",
            message=f"Analysis completed: {completed_results}/{total_results} results",
            total_results=total_results,
            completed_results=completed_results,
            average_confidence=avg_confidence,
            threat_distribution=threat_counts
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get analysis status", error=str(e), analysis_id=analysis_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis status"
        )

@router.get("/results", response_model=List[AnalysisResultResponse])
async def get_analysis_results(
    limit: int = 100,
    offset: int = 0,
    threat_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis results with filtering"""
    try:
        query = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id
        )
        
        # Apply threat level filter
        if threat_level:
            try:
                threat_enum = ThreatLevel(threat_level)
                query = query.filter(AnalysisResult.prediction == threat_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid threat level"
                )
        
        # Apply pagination
        results = query.order_by(AnalysisResult.created_at.desc()).offset(offset).limit(limit).all()
        
        # Convert to response models
        response_results = []
        for result in results:
            response_results.append(AnalysisResultResponse(
                id=result.id,
                log_id=result.log_id,
                model_name=result.model_name,
                confidence_score=result.confidence_score,
                prediction=result.prediction.value,
                processing_time=result.processing_time,
                model_version=result.model_version,
                created_at=result.created_at
            ))
        
        logger.info("Analysis results retrieved", 
                   user_id=current_user.id,
                   result_count=len(response_results))
        
        return response_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get analysis results", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis results"
        )

@router.post("/batch", response_model=AnalysisResponse)
async def batch_analysis(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger batch analysis on multiple log sources"""
    try:
        # Initialize log processor
        log_processor = LogProcessor()
        
        # Process logs from different sources
        processed_logs = []
        
        for source in request.sources:
            if source.type == "file":
                # Process file uploads
                logs = await log_processor.process_file_upload(source.file_id, current_user.id, db)
                processed_logs.extend(logs)
            elif source.type == "api":
                # Process API logs
                logs = await log_processor.process_api_logs(source.data, current_user.id, db)
                processed_logs.extend(logs)
            elif source.type == "stream":
                # Process streaming logs
                logs = await log_processor.process_stream_logs(source.data, current_user.id, db)
                processed_logs.extend(logs)
        
        if not processed_logs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No logs processed from provided sources"
            )
        
        # Initialize analysis service
        analysis_service = AnalysisService()
        
        # Create analysis response
        analysis_id = f"batch_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{current_user.id}"
        
        # Add background task for analysis
        background_tasks.add_task(
            analysis_service.analyze_logs,
            processed_logs,
            current_user.id,
            analysis_id,
            db
        )
        
        logger.info("Batch analysis triggered", 
                   analysis_id=analysis_id,
                   user_id=current_user.id,
                   source_count=len(request.sources),
                   log_count=len(processed_logs))
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="processing",
            message="Batch analysis started in background",
            log_count=len(processed_logs),
            estimated_time="5-10 minutes"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Batch analysis failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to trigger batch analysis"
        )

@router.delete("/results/{result_id}")
async def delete_analysis_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete specific analysis result"""
    try:
        result = db.query(AnalysisResult).filter(
            AnalysisResult.id == result_id,
            AnalysisResult.user_id == current_user.id
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis result not found"
            )
        
        db.delete(result)
        db.commit()
        
        logger.info("Analysis result deleted", 
                   result_id=result_id,
                   user_id=current_user.id)
        
        return {"message": "Analysis result deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete analysis result", error=str(e), result_id=result_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete analysis result"
        ) 