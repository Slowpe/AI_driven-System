from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import structlog
import uuid
from datetime import datetime
import os
import zipfile
import tempfile
import shutil
import aiofiles
import asyncio

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.database import User, SecurityLog, ThreatLevel
from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter()

# Store upload progress in memory (in production, use Redis)
upload_progress = {}

def is_valid_file_type(content_type: str, filename: str) -> bool:
    """Check if file type is allowed"""
    # Check content type
    if content_type in settings.ALLOWED_FILE_TYPES:
        return True
    
    # Check file extension for common types
    allowed_extensions = [
        '.txt', '.log', '.csv', '.json', '.xml', '.html', '.css', '.js',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.pdf',
        '.zip', '.py', '.pyc', '.sql', '.md', '.yaml', '.yml'
    ]
    
    file_ext = os.path.splitext(filename.lower())[1]
    return file_ext in allowed_extensions

@router.post("/upload")
async def upload_log_file(
    file: UploadFile = File(...),
    upload_type: Optional[str] = Form("text"),  # "text" or "visual"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a log file for analysis"""
    try:
        # Validate file type
        if not is_valid_file_type(file.content_type or "", file.filename or ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {file.content_type} ({file.filename})"
            )
        
        # Read file content
        content = await file.read()
        
        # Validate file size
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size {len(content)} exceeds maximum allowed size {settings.MAX_FILE_SIZE}"
            )
        
        # Create unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".log"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Create log entry in database
        log_entry = SecurityLog(
            timestamp=datetime.utcnow(),
            source="file_upload",
            log_type=upload_type or "security_log",
            raw_message=f"Uploaded file: {file.filename}",
            parsed_data={
                "filename": file.filename,
                "file_path": file_path,
                "file_size": len(content),
                "content_type": file.content_type,
                "upload_type": upload_type
            },
            severity=ThreatLevel.NORMAL,
            processed=False,
            file_path=file_path,
            file_size=len(content),
            user_id=current_user.id
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        logger.info("Log file uploaded successfully", 
                   user_id=current_user.id,
                   filename=file.filename,
                   log_id=log_entry.id,
                   upload_type=upload_type)
        
        return {
            "log_id": log_entry.id,
            "filename": file.filename,
            "file_size": len(content),
            "message": "File uploaded successfully",
            "status": "pending_analysis",
            "upload_type": upload_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("File upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.post("/upload-folder")
async def upload_folder(
    files: List[UploadFile] = File(...),
    upload_type: Optional[str] = Form("text"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple files (folder) for analysis"""
    try:
        uploaded_files = []
        failed_files = []
        
        for file in files:
            try:
                # Validate file type
                if not is_valid_file_type(file.content_type or "", file.filename or ""):
                    failed_files.append({
                        "filename": file.filename,
                        "error": f"File type not allowed: {file.content_type}"
                    })
                    continue
                
                # Read file content
                content = await file.read()
                
                # Validate file size
                if len(content) > settings.MAX_FILE_SIZE:
                    failed_files.append({
                        "filename": file.filename,
                        "error": f"File size {len(content)} exceeds maximum allowed size"
                    })
                    continue
                
                # Create unique filename
                file_extension = os.path.splitext(file.filename)[1] if file.filename else ".log"
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
                
                # Ensure upload directory exists
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
                
                # Save file
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                
                # Create log entry in database
                log_entry = SecurityLog(
                    timestamp=datetime.utcnow(),
                    source="folder_upload",
                    log_type=upload_type or "security_log",
                    raw_message=f"Uploaded file from folder: {file.filename}",
                    parsed_data={
                        "filename": file.filename,
                        "file_path": file_path,
                        "file_size": len(content),
                        "content_type": file.content_type,
                        "upload_type": upload_type
                    },
                    severity=ThreatLevel.NORMAL,
                    processed=False,
                    file_path=file_path,
                    file_size=len(content),
                    user_id=current_user.id
                )
                
                db.add(log_entry)
                db.commit()  # Commit to get the ID
                db.refresh(log_entry)  # Refresh to get the ID
                uploaded_files.append({
                    "log_id": log_entry.id,
                    "filename": file.filename,
                    "file_size": len(content),
                    "status": "pending_analysis"
                })
                
            except Exception as e:
                failed_files.append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        # Commit all successful uploads
        # db.commit()  # Removed since we commit individually
        
        logger.info("Folder upload completed", 
                   user_id=current_user.id,
                   uploaded_count=len(uploaded_files),
                   failed_count=len(failed_files))
        
        return {
            "uploaded_files": uploaded_files,
            "failed_files": failed_files,
            "total_uploaded": len(uploaded_files),
            "total_failed": len(failed_files),
            "message": f"Uploaded {len(uploaded_files)} files successfully"
        }
        
    except Exception as e:
        logger.error("Folder upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload folder: {str(e)}"
        )

@router.get("/")
async def get_logs(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get logs for the current user"""
    try:
        logs = db.query(SecurityLog).filter(
            SecurityLog.user_id == current_user.id
        ).order_by(SecurityLog.timestamp.desc()).offset(offset).limit(limit).all()
        
        # Convert to response format
        log_list = []
        for log in logs:
            log_list.append({
                "id": log.id,
                "timestamp": log.timestamp,
                "source": log.source,
                "log_type": log.log_type,
                "severity": log.severity.value if log.severity else "normal",
                "processed": log.processed,
                "file_path": log.file_path,
                "file_size": log.file_size
            })
        
        logger.info("Logs retrieved", user_id=current_user.id, count=len(log_list))
        
        return {
            "logs": log_list,
            "total": len(log_list),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error("Failed to get logs", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get logs"
        )

@router.get("/{log_id}")
async def get_log_detail(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific log"""
    try:
        log = db.query(SecurityLog).filter(
            SecurityLog.id == log_id,
            SecurityLog.user_id == current_user.id
        ).first()
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Log not found"
            )
        
        return {
            "id": log.id,
            "timestamp": log.timestamp,
            "source": log.source,
            "log_type": log.log_type,
            "raw_message": log.raw_message,
            "parsed_data": log.parsed_data,
            "severity": log.severity.value if log.severity else "normal",
            "processed": log.processed,
            "file_path": log.file_path,
            "file_size": log.file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get log detail", error=str(e), log_id=log_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get log detail"
        )

@router.post("/upload-chunk")
async def upload_chunk(
    chunk: UploadFile = File(...),
    chunk_number: int = Form(...),
    total_chunks: int = Form(...),
    file_id: str = Form(...),
    filename: str = Form(...),
    upload_type: Optional[str] = Form("text"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a chunk of a large file"""
    try:
        # Validate file type
        if not is_valid_file_type(chunk.content_type or "", filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {chunk.content_type} ({filename})"
            )
        
        # Create temp directory for chunks
        temp_dir = os.path.join(settings.UPLOAD_DIR, "temp", file_id)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save chunk
        chunk_path = os.path.join(temp_dir, f"chunk_{chunk_number}")
        chunk_content = await chunk.read()
        
        async with aiofiles.open(chunk_path, 'wb') as f:
            await f.write(chunk_content)
        
        # Update progress
        if file_id not in upload_progress:
            upload_progress[file_id] = {
                "filename": filename,
                "total_chunks": total_chunks,
                "received_chunks": set(),
                "upload_type": upload_type,
                "user_id": current_user.id
            }
        
        upload_progress[file_id]["received_chunks"].add(chunk_number)
        
        # Check if all chunks received
        if len(upload_progress[file_id]["received_chunks"]) == total_chunks:
            # Combine chunks
            final_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_{filename}")
            
            async with aiofiles.open(final_path, 'wb') as outfile:
                for i in range(1, total_chunks + 1):
                    chunk_file = os.path.join(temp_dir, f"chunk_{i}")
                    if os.path.exists(chunk_file):
                        async with aiofiles.open(chunk_file, 'rb') as infile:
                            content = await infile.read()
                            await outfile.write(content)
            
            # Clean up temp directory
            shutil.rmtree(temp_dir)
            
            # Create log entry
            file_size = os.path.getsize(final_path)
            log_entry = SecurityLog(
                timestamp=datetime.utcnow(),
                source="chunked_upload",
                log_type=upload_type or "security_log",
                raw_message=f"Uploaded large file: {filename}",
                parsed_data={
                    "filename": filename,
                    "file_path": final_path,
                    "file_size": file_size,
                    "upload_type": upload_type,
                    "chunks": total_chunks
                },
                severity=ThreatLevel.NORMAL,
                processed=False,
                file_path=final_path,
                file_size=file_size,
                user_id=current_user.id
            )
            
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            # Clean up progress
            del upload_progress[file_id]
            
            logger.info("Large file upload completed", 
                       user_id=current_user.id,
                       filename=filename,
                       log_id=log_entry.id,
                       chunks=total_chunks)
            
            return {
                "log_id": log_entry.id,
                "filename": filename,
                "file_size": file_size,
                "message": "File upload completed",
                "status": "completed",
                "upload_type": upload_type
            }
        else:
            # Return progress
            progress = len(upload_progress[file_id]["received_chunks"]) / total_chunks * 100
            return {
                "message": "Chunk uploaded successfully",
                "progress": round(progress, 2),
                "chunks_received": len(upload_progress[file_id]["received_chunks"]),
                "total_chunks": total_chunks
            }
        
    except Exception as e:
        logger.error("Chunk upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload chunk: {str(e)}"
        )

@router.get("/upload-progress/{file_id}")
async def get_upload_progress(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get upload progress for a file"""
    if file_id not in upload_progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    progress_data = upload_progress[file_id]
    if progress_data["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    progress = len(progress_data["received_chunks"]) / progress_data["total_chunks"] * 100
    return {
        "filename": progress_data["filename"],
        "progress": round(progress, 2),
        "chunks_received": len(progress_data["received_chunks"]),
        "total_chunks": progress_data["total_chunks"]
    }

@router.post("/upload-streaming")
async def upload_streaming(
    file: UploadFile = File(...),
    upload_type: Optional[str] = Form("text"),
    resume_upload_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Streaming upload for very large files (20GB+)"""
    try:
        # Validate file type
        if not is_valid_file_type(file.content_type or "", file.filename or ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {file.content_type} ({file.filename})"
            )
        
        # Generate or use existing upload ID
        upload_id = resume_upload_id or str(uuid.uuid4())
        temp_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, f"{upload_id}.tmp")
        
        # Create temp directory if it doesn't exist
        os.makedirs(os.path.dirname(temp_file_path), exist_ok=True)
        
        # Stream the file content directly to disk
        total_size = 0
        chunk_size = 1024 * 1024  # 1MB buffer for streaming
        
        mode = 'ab' if resume_upload_id and os.path.exists(temp_file_path) else 'wb'
        
        async with aiofiles.open(temp_file_path, mode) as f:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                await f.write(chunk)
                total_size += len(chunk)
                
                # Check if we're approaching memory limits
                if total_size > settings.MAX_FILE_SIZE:
                    await f.close()
                    os.remove(temp_file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / (1024**3):.1f}GB"
                    )
        
        # Get final file size
        final_size = os.path.getsize(temp_file_path)
        
        # Create log entry
        log_entry = SecurityLog(
            timestamp=datetime.utcnow(),
            source="streaming_upload",
            log_type=upload_type or "security_log",
            raw_message=f"Uploaded large file via streaming: {file.filename}",
            parsed_data={
                "filename": file.filename,
                "file_path": temp_file_path,
                "file_size": final_size,
                "upload_type": upload_type,
                "upload_id": upload_id,
                "upload_method": "streaming"
            },
            severity=ThreatLevel.NORMAL,
            processed=False,
            file_path=temp_file_path,
            file_size=final_size,
            user_id=current_user.id
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        logger.info("Streaming upload completed", 
                   user_id=current_user.id,
                   filename=file.filename,
                   log_id=log_entry.id,
                   file_size_gb=final_size / (1024**3))
        
        return {
            "log_id": log_entry.id,
            "filename": file.filename,
            "file_size": final_size,
            "file_size_gb": round(final_size / (1024**3), 2),
            "message": "Large file uploaded successfully via streaming",
            "status": "completed",
            "upload_type": upload_type,
            "upload_method": "streaming"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Streaming upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file via streaming: {str(e)}"
        )

@router.post("/upload-resume")
async def resume_upload(
    upload_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resume an interrupted upload"""
    try:
        temp_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, f"{upload_id}.tmp")
        
        if not os.path.exists(temp_file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload session not found"
            )
        
        # Get file info
        file_size = os.path.getsize(temp_file_path)
        
        return {
            "upload_id": upload_id,
            "file_size": file_size,
            "file_size_gb": round(file_size / (1024**3), 2),
            "can_resume": True,
            "message": "Upload session found, can resume"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Resume upload check failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check upload status: {str(e)}"
        )

@router.delete("/upload-cancel/{upload_id}")
async def cancel_upload(
    upload_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel an ongoing upload"""
    try:
        temp_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, f"{upload_id}.tmp")
        
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            logger.info("Upload cancelled", user_id=current_user.id, upload_id=upload_id)
        
        return {
            "message": "Upload cancelled successfully",
            "upload_id": upload_id
        }
        
    except Exception as e:
        logger.error("Cancel upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel upload: {str(e)}"
        ) 