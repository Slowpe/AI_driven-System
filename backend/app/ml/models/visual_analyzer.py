import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from PIL import Image
import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional
import structlog
from datetime import datetime
import os

logger = structlog.get_logger()

class SecurityVisualAnalyzer:
    """
    ResNet-based visual analyzer for security image analysis
    """
    
    def __init__(self, model_path: Optional[str] = None, num_classes: int = 3):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.num_classes = num_classes
        
        # Initialize ResNet model
        self.model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        
        # Modify final layer for security classification
        num_features = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        
        # Load custom weights if provided
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        
        self.model.to(self.device)
        self.model.eval()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Security-specific image features
        self.malware_patterns = {
            'entropy_threshold': 7.5,  # High entropy indicates encryption/packing
            'color_variance_threshold': 0.3,  # Low variance might indicate steganography
            'edge_density_threshold': 0.1,  # High edge density might indicate noise
        }
        
        logger.info("SecurityVisualAnalyzer initialized", 
                   device=str(self.device), 
                   model_path=model_path)
    
    def extract_image_features(self, image: np.ndarray) -> Dict:
        """Extract security-relevant features from image"""
        features = {
            'entropy': self.calculate_entropy(image),
            'color_variance': self.calculate_color_variance(image),
            'edge_density': self.calculate_edge_density(image),
            'file_size': self.get_file_size(image),
            'dimensions': image.shape,
            'aspect_ratio': image.shape[1] / image.shape[0],
            'brightness': np.mean(image),
            'contrast': np.std(image)
        }
        return features
    
    def calculate_entropy(self, image: np.ndarray) -> float:
        """Calculate image entropy (measure of randomness)"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        hist = hist / hist.sum()
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        return entropy
    
    def calculate_color_variance(self, image: np.ndarray) -> float:
        """Calculate color variance across the image"""
        if len(image.shape) == 3:
            return np.var(image, axis=(0, 1)).mean()
        return np.var(image)
    
    def calculate_edge_density(self, image: np.ndarray) -> float:
        """Calculate edge density using Canny edge detection"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        return edge_density
    
    def get_file_size(self, image: np.ndarray) -> int:
        """Get approximate file size of image"""
        return image.nbytes
    
    def detect_suspicious_patterns(self, image: np.ndarray) -> Dict:
        """Detect suspicious patterns in the image"""
        patterns = {
            'high_entropy': False,
            'low_color_variance': False,
            'high_edge_density': False,
            'steganography_suspicious': False,
            'encryption_suspicious': False
        }
        
        features = self.extract_image_features(image)
        
        # Check for high entropy (potential encryption/packing)
        if features['entropy'] > self.malware_patterns['entropy_threshold']:
            patterns['high_entropy'] = True
            patterns['encryption_suspicious'] = True
        
        # Check for low color variance (potential steganography)
        if features['color_variance'] < self.malware_patterns['color_variance_threshold']:
            patterns['low_color_variance'] = True
            patterns['steganography_suspicious'] = True
        
        # Check for high edge density (potential noise/injection)
        if features['edge_density'] > self.malware_patterns['edge_density_threshold']:
            patterns['high_edge_density'] = True
        
        return patterns
    
    def extract_salient_regions(self, image: np.ndarray) -> List[Dict]:
        """Extract salient regions for explainability"""
        salient_regions = []
        
        # Convert to grayscale for processing
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        # Use different methods to find salient regions
        
        # 1. Edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in edge_contours[:5]:  # Top 5 regions
            if cv2.contourArea(contour) > 100:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(contour)
                salient_regions.append({
                    'type': 'edge_region',
                    'bbox': [x, y, w, h],
                    'area': cv2.contourArea(contour),
                    'confidence': min(cv2.contourArea(contour) / 1000, 1.0)
                })
        
        # 2. High entropy regions
        entropy_map = self.calculate_local_entropy(gray)
        high_entropy_coords = np.where(entropy_map > self.malware_patterns['entropy_threshold'])
        
        if len(high_entropy_coords[0]) > 0:
            # Find clusters of high entropy pixels
            from sklearn.cluster import DBSCAN
            coords = np.column_stack(high_entropy_coords)
            if len(coords) > 10:
                clustering = DBSCAN(eps=20, min_samples=5).fit(coords)
                
                for cluster_id in set(clustering.labels_):
                    if cluster_id != -1:  # Not noise
                        cluster_points = coords[clustering.labels_ == cluster_id]
                        x_min, y_min = cluster_points.min(axis=0)
                        x_max, y_max = cluster_points.max(axis=0)
                        
                        salient_regions.append({
                            'type': 'high_entropy_region',
                            'bbox': [int(x_min), int(y_min), int(x_max-x_min), int(y_max-y_min)],
                            'area': len(cluster_points),
                            'confidence': min(len(cluster_points) / 100, 1.0)
                        })
        
        return salient_regions
    
    def calculate_local_entropy(self, gray_image: np.ndarray, window_size: int = 8) -> np.ndarray:
        """Calculate local entropy map"""
        height, width = gray_image.shape
        entropy_map = np.zeros((height, width))
        
        for i in range(0, height - window_size, window_size // 2):
            for j in range(0, width - window_size, window_size // 2):
                window = gray_image[i:i+window_size, j:j+window_size]
                hist = cv2.calcHist([window], [0], None, [256], [0, 256])
                hist = hist / hist.sum()
                entropy = -np.sum(hist * np.log2(hist + 1e-10))
                entropy_map[i:i+window_size, j:j+window_size] = entropy
        
        return entropy_map
    
    def analyze_image(self, image_path: str) -> Dict:
        """Analyze image for security threats"""
        start_time = datetime.now()
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_array = np.array(image)
            
            # Extract features
            features = self.extract_image_features(image_array)
            suspicious_patterns = self.detect_suspicious_patterns(image_array)
            salient_regions = self.extract_salient_regions(image_array)
            
            # Prepare image for model
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Get model predictions
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                
                # Get prediction and confidence
                prediction = torch.argmax(probabilities, dim=1).item()
                confidence = float(torch.max(probabilities))
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Map prediction to threat level
            threat_levels = ['normal', 'suspicious', 'malicious']
            threat_level = threat_levels[prediction]
            
            # Calculate risk score
            risk_score = self.calculate_risk_score(features, suspicious_patterns, confidence)
            
            result = {
                'threat_level': threat_level,
                'confidence': confidence,
                'risk_score': risk_score,
                'features': features,
                'suspicious_patterns': suspicious_patterns,
                'salient_regions': salient_regions,
                'processing_time': processing_time,
                'model_name': 'resnet50_security',
                'prediction_probabilities': probabilities.cpu().numpy().tolist()[0]
            }
            
            logger.info("Image analysis completed",
                       threat_level=threat_level,
                       confidence=confidence,
                       processing_time=processing_time)
            
            return result
            
        except Exception as e:
            logger.error("Error in image analysis", error=str(e), image_path=image_path)
            return {
                'threat_level': 'normal',
                'confidence': 0.0,
                'risk_score': 0.0,
                'features': {},
                'error': str(e),
                'processing_time': (datetime.now() - start_time).total_seconds()
            }
    
    def calculate_risk_score(self, features: Dict, patterns: Dict, confidence: float) -> float:
        """Calculate risk score based on features and patterns"""
        risk_score = 0.0
        
        # Base score from confidence
        risk_score += confidence * 0.3
        
        # Suspicious patterns
        if patterns['high_entropy']:
            risk_score += 0.2
        if patterns['low_color_variance']:
            risk_score += 0.15
        if patterns['high_edge_density']:
            risk_score += 0.1
        if patterns['encryption_suspicious']:
            risk_score += 0.25
        if patterns['steganography_suspicious']:
            risk_score += 0.2
        
        # Feature-based scoring
        if features['entropy'] > 8.0:
            risk_score += 0.1
        if features['aspect_ratio'] > 3.0 or features['aspect_ratio'] < 0.33:
            risk_score += 0.05  # Unusual aspect ratios
        
        return min(risk_score, 1.0)
    
    def batch_analyze(self, image_paths: List[str]) -> List[Dict]:
        """Analyze multiple images in batch"""
        results = []
        for image_path in image_paths:
            result = self.analyze_image(image_path)
            results.append(result)
        return results
    
    def save_model(self, path: str):
        """Save the model to disk"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'num_classes': self.num_classes,
            'malware_patterns': self.malware_patterns
        }, path)
        logger.info("Model saved", path=path)
    
    def load_model(self, path: str):
        """Load the model from disk"""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.num_classes = checkpoint.get('num_classes', 3)
        self.malware_patterns = checkpoint.get('malware_patterns', self.malware_patterns)
        logger.info("Model loaded", path=path) 