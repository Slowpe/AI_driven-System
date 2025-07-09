import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import structlog
from pathlib import Path

from app.core.config import settings
from app.ml.models.text_analyzer import TextAnalyzer
from app.ml.models.visual_analyzer import VisualAnalyzer

logger = structlog.get_logger()

class EnsembleAnalyzer:
    """
    Ensemble model that combines text and visual analysis results
    for comprehensive threat detection
    """
    
    def __init__(self):
        self.text_analyzer = TextAnalyzer()
        self.visual_analyzer = VisualAnalyzer()
        self.ensemble_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Load pre-trained model if exists
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained ensemble model"""
        model_path = Path(settings.ENSEMBLE_MODEL_PATH)
        if model_path.exists():
            try:
                self.ensemble_model = joblib.load(model_path)
                self.is_trained = True
                logger.info("Loaded pre-trained ensemble model")
            except Exception as e:
                logger.error("Failed to load ensemble model", error=str(e))
    
    def _save_model(self):
        """Save trained ensemble model"""
        try:
            model_path = Path(settings.ENSEMBLE_MODEL_PATH)
            model_path.parent.mkdir(parents=True, exist_ok=True)
            joblib.dump(self.ensemble_model, model_path)
            logger.info("Saved ensemble model")
        except Exception as e:
            logger.error("Failed to save ensemble model", error=str(e))
    
    def extract_features(self, text_data: str = None, image_data: bytes = None) -> np.ndarray:
        """
        Extract features from text and/or image data
        
        Args:
            text_data: Text content to analyze
            image_data: Image bytes to analyze
            
        Returns:
            Feature vector for ensemble model
        """
        features = []
        
        # Text features
        if text_data:
            text_features = self.text_analyzer.extract_features(text_data)
            features.extend(text_features)
        else:
            # Pad with zeros if no text data
            features.extend([0.0] * 768)  # BERT embedding size
        
        # Visual features
        if image_data:
            visual_features = self.visual_analyzer.extract_features(image_data)
            features.extend(visual_features)
        else:
            # Pad with zeros if no image data
            features.extend([0.0] * 2048)  # ResNet feature size
        
        # Additional engineered features
        engineered_features = self._engineer_features(text_data, image_data)
        features.extend(engineered_features)
        
        return np.array(features)
    
    def _engineer_features(self, text_data: str = None, image_data: bytes = None) -> List[float]:
        """Engineer additional features from raw data"""
        features = []
        
        # Text-based features
        if text_data:
            features.extend([
                len(text_data),  # Text length
                text_data.count('http'),  # URL count
                text_data.count('@'),  # Mention count
                text_data.count('#'),  # Hashtag count
                text_data.count('.'),  # Sentence count (rough)
                text_data.count('!'),  # Exclamation count
                text_data.count('?'),  # Question count
                sum(1 for c in text_data if c.isupper()),  # Uppercase count
                sum(1 for c in text_data if c.isdigit()),  # Digit count
            ])
        else:
            features.extend([0.0] * 9)
        
        # Image-based features
        if image_data:
            features.extend([
                len(image_data),  # Image size
                1.0,  # Has image flag
            ])
        else:
            features.extend([0.0, 0.0])
        
        return features
    
    def train(self, training_data: List[Dict[str, Any]]):
        """
        Train the ensemble model
        
        Args:
            training_data: List of training samples with 'text', 'image', 'label' keys
        """
        logger.info("Training ensemble model")
        
        # Extract features and labels
        X = []
        y = []
        
        for sample in training_data:
            features = self.extract_features(
                text_data=sample.get('text'),
                image_data=sample.get('image')
            )
            X.append(features)
            y.append(sample['label'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Create ensemble model
        rf1 = RandomForestClassifier(n_estimators=100, random_state=42)
        rf2 = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
        
        self.ensemble_model = VotingClassifier(
            estimators=[('rf1', rf1), ('rf2', rf2)],
            voting='soft'
        )
        
        # Train model
        self.ensemble_model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.ensemble_model.score(X_train_scaled, y_train)
        test_score = self.ensemble_model.score(X_test_scaled, y_test)
        
        logger.info(f"Ensemble model trained - Train score: {train_score:.3f}, Test score: {test_score:.3f}")
        
        self.is_trained = True
        self._save_model()
    
    def predict(self, text_data: str = None, image_data: bytes = None) -> Dict[str, Any]:
        """
        Make threat prediction using ensemble model
        
        Args:
            text_data: Text content to analyze
            image_data: Image bytes to analyze
            
        Returns:
            Prediction results with confidence scores
        """
        if not self.is_trained:
            raise ValueError("Ensemble model not trained. Please train the model first.")
        
        # Extract features
        features = self.extract_features(text_data, image_data)
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # Get predictions
        prediction = self.ensemble_model.predict(features_scaled)[0]
        probabilities = self.ensemble_model.predict_proba(features_scaled)[0]
        
        # Get individual model predictions
        text_prediction = None
        visual_prediction = None
        
        if text_data:
            text_prediction = self.text_analyzer.predict(text_data)
        
        if image_data:
            visual_prediction = self.visual_analyzer.predict(image_data)
        
        # Determine confidence and severity
        confidence = max(probabilities)
        severity = self._determine_severity(confidence, prediction, text_prediction, visual_prediction)
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'severity': severity,
            'probabilities': {
                'benign': float(probabilities[0]),
                'malicious': float(probabilities[1])
            },
            'text_analysis': text_prediction,
            'visual_analysis': visual_prediction,
            'ensemble_score': confidence
        }
    
    def _determine_severity(self, confidence: float, prediction: str, 
                          text_pred: Dict = None, visual_pred: Dict = None) -> str:
        """Determine threat severity based on confidence and individual predictions"""
        
        if confidence < 0.6:
            return "low"
        elif confidence < 0.8:
            return "medium"
        else:
            return "high"
    
    def analyze_batch(self, data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze multiple samples in batch
        
        Args:
            data_list: List of samples with 'text' and/or 'image' keys
            
        Returns:
            List of analysis results
        """
        results = []
        
        for data in data_list:
            try:
                result = self.predict(
                    text_data=data.get('text'),
                    image_data=data.get('image')
                )
                results.append({
                    'id': data.get('id'),
                    'result': result,
                    'status': 'success'
                })
            except Exception as e:
                logger.error("Batch analysis failed for sample", error=str(e))
                results.append({
                    'id': data.get('id'),
                    'result': None,
                    'status': 'error',
                    'error': str(e)
                })
        
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the ensemble model"""
        return {
            'is_trained': self.is_trained,
            'model_type': 'ensemble',
            'text_analyzer': self.text_analyzer.get_model_info(),
            'visual_analyzer': self.visual_analyzer.get_model_info(),
            'feature_dimension': 768 + 2048 + 11,  # BERT + ResNet + engineered features
            'model_path': settings.ENSEMBLE_MODEL_PATH
        } 