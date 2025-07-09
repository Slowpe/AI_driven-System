from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
import structlog

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.database import User, SecurityLog, AnalysisResult, Alert, SystemMetrics, ThreatLevel

logger = structlog.get_logger()
router = APIRouter()

@router.get("/metrics")
async def get_system_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system metrics for dashboard"""
    try:
        # Get total alerts (logs) for the user
        total_alerts = db.query(SecurityLog).filter(
            SecurityLog.user_id == current_user.id
        ).count()
        
        # Get threats neutralized (completed analysis with high confidence)
        neutralized_threats = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id,
            AnalysisResult.confidence_score >= 0.8
        ).count()
        
        # Calculate neutralization percentage
        total_analysis = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id
        ).count()
        
        neutralized_percentage = (neutralized_threats / total_analysis * 100) if total_analysis > 0 else 0
        
        # Get high-risk events (critical threats)
        high_risk_events = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id,
            AnalysisResult.prediction == ThreatLevel.CRITICAL
        ).count()
        
        # System uptime (mock data for now)
        system_uptime = 99.9
        
        logger.info("System metrics retrieved", user_id=current_user.id)
        
        return {
            "total_alerts": total_alerts,
            "threats_neutralized": round(neutralized_percentage, 1),
            "high_risk_count": high_risk_events,
            "system_uptime": system_uptime,
            "total_analysis": total_analysis,
            "neutralized_count": neutralized_threats
        }
        
    except Exception as e:
        logger.error("Failed to get system metrics", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system metrics"
        )

@router.get("/threats")
async def get_threat_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get threat summary for dashboard"""
    try:
        # Get threat distribution by level
        threat_distribution = {}
        for level in ThreatLevel:
            count = db.query(AnalysisResult).filter(
                AnalysisResult.user_id == current_user.id,
                AnalysisResult.prediction == level
            ).count()
            threat_distribution[level.value] = count
        
        # Get high-risk count
        high_risk_count = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id,
            AnalysisResult.prediction.in_([ThreatLevel.HIGH, ThreatLevel.CRITICAL])
        ).count()
        
        # Get recent threats (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        recent_threats = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id,
            AnalysisResult.created_at >= yesterday,
            AnalysisResult.prediction.in_([ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL])
        ).count()
        
        logger.info("Threat summary retrieved", user_id=current_user.id)
        
        return {
            "threat_distribution": threat_distribution,
            "high_risk_count": high_risk_count,
            "recent_threats": recent_threats,
            "total_threats": sum(threat_distribution.values())
        }
        
    except Exception as e:
        logger.error("Failed to get threat summary", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get threat summary"
        )

@router.get("/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics for dashboard"""
    try:
        # Get model performance data
        model_performance = db.query(
            AnalysisResult.model_name,
            func.avg(AnalysisResult.confidence_score).label('avg_confidence'),
            func.count(AnalysisResult.id).label('total_predictions'),
            func.avg(AnalysisResult.processing_time).label('avg_processing_time')
        ).filter(
            AnalysisResult.user_id == current_user.id
        ).group_by(AnalysisResult.model_name).all()
        
        # Convert to list of dicts
        performance_data = []
        for perf in model_performance:
            performance_data.append({
                "model_name": perf.model_name,
                "avg_confidence": float(perf.avg_confidence) if perf.avg_confidence else 0,
                "total_predictions": perf.total_predictions,
                "avg_processing_time": float(perf.avg_processing_time) if perf.avg_processing_time else 0
            })
        
        # Get overall performance stats
        total_analysis = db.query(AnalysisResult).filter(
            AnalysisResult.user_id == current_user.id
        ).count()
        
        avg_confidence = db.query(func.avg(AnalysisResult.confidence_score)).filter(
            AnalysisResult.user_id == current_user.id
        ).scalar()
        
        logger.info("Performance metrics retrieved", user_id=current_user.id)
        
        return {
            "model_performance": performance_data,
            "total_analysis": total_analysis,
            "overall_confidence": float(avg_confidence) if avg_confidence else 0,
            "models_count": len(performance_data)
        }
        
    except Exception as e:
        logger.error("Failed to get performance metrics", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get performance metrics"
        )

@router.get("/activity")
async def get_activity_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity timeline for dashboard"""
    try:
        from datetime import datetime, timedelta
        
        # Get activity for the last 24 hours, grouped by hour
        timeline_data = []
        now = datetime.utcnow()
        
        for i in range(24):
            hour_start = now - timedelta(hours=i+1)
            hour_end = now - timedelta(hours=i)
            
            # Count threats in this hour
            threat_count = db.query(AnalysisResult).filter(
                AnalysisResult.user_id == current_user.id,
                AnalysisResult.created_at >= hour_start,
                AnalysisResult.created_at < hour_end,
                AnalysisResult.prediction.in_([ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL])
            ).count()
            
            timeline_data.append({
                "time": hour_start.strftime("%H:%M"),
                "threats": threat_count
            })
        
        # Reverse to show oldest first
        timeline_data.reverse()
        
        logger.info("Activity timeline retrieved", user_id=current_user.id)
        
        return {
            "timeline": timeline_data,
            "total_period": "24 hours"
        }
        
    except Exception as e:
        logger.error("Failed to get activity timeline", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get activity timeline"
        ) 