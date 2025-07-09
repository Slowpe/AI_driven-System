import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel, BertForSequenceClassification
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import numpy as np
from typing import Dict, List, Tuple, Optional
import structlog
from datetime import datetime

logger = structlog.get_logger()

class SecurityTextAnalyzer:
    """
    BERT-based text analyzer for security log analysis
    """
    
    def __init__(self, model_name: str = "bert-base-uncased", max_length: int = 512):
        self.model_name = model_name
        self.max_length = max_length
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize BERT model and tokenizer
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=5,  # Normal, Low, Medium, High, Critical
            output_attentions=True
        )
        self.model.to(self.device)
        
        # TF-IDF for additional features
        self.tfidf = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            stop_words='english'
        )
        
        # Threat indicators
        self.threat_keywords = {
            'critical': ['exploit', 'vulnerability', 'breach', 'hack', 'attack', 'malware', 'virus'],
            'high': ['suspicious', 'unauthorized', 'failed', 'denied', 'blocked', 'firewall'],
            'medium': ['warning', 'error', 'timeout', 'connection', 'port', 'scan'],
            'low': ['info', 'debug', 'trace', 'log', 'access', 'request']
        }
        
        # IP address patterns
        self.ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
        self.url_pattern = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
        
        logger.info("SecurityTextAnalyzer initialized", model_name=model_name, device=str(self.device))
    
    def extract_features(self, text: str) -> Dict:
        """Extract security-relevant features from text"""
        features = {
            'ip_addresses': self.extract_ips(text),
            'urls': self.extract_urls(text),
            'status_codes': self.extract_status_codes(text),
            'user_agents': self.extract_user_agents(text),
            'threat_keywords': self.count_threat_keywords(text),
            'text_length': len(text),
            'special_chars': self.count_special_chars(text),
            'uppercase_ratio': self.calculate_uppercase_ratio(text)
        }
        return features
    
    def extract_ips(self, text: str) -> List[str]:
        """Extract IP addresses from text"""
        return self.ip_pattern.findall(text)
    
    def extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text"""
        return self.url_pattern.findall(text)
    
    def extract_status_codes(self, text: str) -> List[str]:
        """Extract HTTP status codes"""
        status_pattern = re.compile(r'\b(?:1\d{2}|2\d{2}|3\d{2}|4\d{2}|5\d{2})\b')
        return status_pattern.findall(text)
    
    def extract_user_agents(self, text: str) -> List[str]:
        """Extract user agent strings"""
        ua_pattern = re.compile(r'[A-Za-z0-9\-\.]+/[0-9\.]+')
        return ua_pattern.findall(text)
    
    def count_threat_keywords(self, text: str) -> Dict[str, int]:
        """Count threat keywords by severity level"""
        text_lower = text.lower()
        counts = {}
        for severity, keywords in self.threat_keywords.items():
            counts[severity] = sum(1 for keyword in keywords if keyword in text_lower)
        return counts
    
    def count_special_chars(self, text: str) -> int:
        """Count special characters that might indicate encoding or injection attempts"""
        special_chars = re.findall(r'[<>\"\'&;(){}[\]]', text)
        return len(special_chars)
    
    def calculate_uppercase_ratio(self, text: str) -> float:
        """Calculate ratio of uppercase letters"""
        if not text:
            return 0.0
        uppercase_count = sum(1 for char in text if char.isupper())
        return uppercase_count / len(text)
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Normalize common security log patterns
        text = re.sub(r'\[([^\]]+)\]', r'\1', text)  # Remove brackets but keep content
        text = re.sub(r'\"([^\"]+)\"', r'\1', text)  # Remove quotes but keep content
        
        return text
    
    def analyze(self, text: str) -> Dict:
        """Analyze text for security threats"""
        start_time = datetime.now()
        
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Extract features
            features = self.extract_features(processed_text)
            
            # Tokenize for BERT
            inputs = self.tokenizer(
                processed_text,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_length,
                padding=True
            )
            
            # Move inputs to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get model predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                attentions = outputs.attentions
                probabilities = torch.softmax(logits, dim=1)
                
                # Get prediction and confidence
                prediction = torch.argmax(probabilities, dim=1).item()
                confidence = float(torch.max(probabilities))
                
                # Get attention weights for explainability
                attention_weights = self.extract_attention_weights(attentions, inputs['input_ids'])
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Map prediction to threat level
            threat_levels = ['normal', 'low', 'medium', 'high', 'critical']
            threat_level = threat_levels[prediction]
            
            # Calculate additional risk score based on features
            risk_score = self.calculate_risk_score(features, confidence)
            
            result = {
                'threat_level': threat_level,
                'confidence': confidence,
                'risk_score': risk_score,
                'features': features,
                'attention_weights': attention_weights,
                'processing_time': processing_time,
                'model_name': self.model_name,
                'prediction_probabilities': probabilities.cpu().numpy().tolist()[0]
            }
            
            logger.info("Text analysis completed",
                       threat_level=threat_level,
                       confidence=confidence,
                       processing_time=processing_time)
            
            return result
            
        except Exception as e:
            logger.error("Error in text analysis", error=str(e), text=text[:100])
            return {
                'threat_level': 'normal',
                'confidence': 0.0,
                'risk_score': 0.0,
                'features': {},
                'error': str(e),
                'processing_time': (datetime.now() - start_time).total_seconds()
            }
    
    def extract_attention_weights(self, attentions, input_ids) -> Dict:
        """Extract attention weights for explainability"""
        if not attentions:
            return {}
        
        # Get attention from last layer
        last_attention = attentions[-1][0]  # Shape: (batch_size, num_heads, seq_len, seq_len)
        
        # Average across attention heads
        avg_attention = torch.mean(last_attention, dim=1)  # Shape: (batch_size, seq_len, seq_len)
        
        # Get attention to [CLS] token (first token)
        cls_attention = avg_attention[0, 0, :].cpu().numpy()
        
        # Get tokens
        tokens = self.tokenizer.convert_ids_to_tokens(input_ids[0].cpu().numpy())
        
        # Create attention mapping
        attention_mapping = {}
        for i, (token, attention) in enumerate(zip(tokens, cls_attention)):
            if token not in ['[CLS]', '[PAD]', '[SEP]']:
                attention_mapping[token] = float(attention)
        
        return attention_mapping
    
    def calculate_risk_score(self, features: Dict, confidence: float) -> float:
        """Calculate additional risk score based on features"""
        risk_score = 0.0
        
        # Base score from confidence
        risk_score += confidence * 0.4
        
        # Threat keywords
        keyword_weights = {'critical': 0.3, 'high': 0.2, 'medium': 0.1, 'low': 0.05}
        for severity, count in features.get('threat_keywords', {}).items():
            risk_score += count * keyword_weights.get(severity, 0)
        
        # Special characters (potential injection attempts)
        special_char_ratio = features.get('special_chars', 0) / max(features.get('text_length', 1), 1)
        risk_score += special_char_ratio * 0.2
        
        # Uppercase ratio (potential shouting)
        uppercase_ratio = features.get('uppercase_ratio', 0)
        if uppercase_ratio > 0.5:
            risk_score += (uppercase_ratio - 0.5) * 0.1
        
        return min(risk_score, 1.0)
    
    def batch_analyze(self, texts: List[str]) -> List[Dict]:
        """Analyze multiple texts in batch"""
        results = []
        for text in texts:
            result = self.analyze(text)
            results.append(result)
        return results
    
    def save_model(self, path: str):
        """Save the model to disk"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'tokenizer': self.tokenizer,
            'tfidf': self.tfidf,
            'threat_keywords': self.threat_keywords
        }, path)
        logger.info("Model saved", path=path)
    
    def load_model(self, path: str):
        """Load the model from disk"""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.tokenizer = checkpoint['tokenizer']
        self.tfidf = checkpoint['tfidf']
        self.threat_keywords = checkpoint['threat_keywords']
        logger.info("Model loaded", path=path) 