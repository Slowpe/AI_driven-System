# VISTA AI Cybersecurity Platform - Backend

A comprehensive AI-powered cybersecurity analysis backend built with FastAPI, PyTorch, and modern ML techniques.

## 🚀 Features

- **AI-Powered Analysis**: Text and visual threat detection using BERT and ResNet
- **Ensemble Learning**: Combines multiple models for improved accuracy
- **Real-time Processing**: FastAPI with async support
- **Background Tasks**: Celery for heavy processing
- **Monitoring**: Prometheus metrics and structured logging
- **Authentication**: JWT-based security
- **Database**: PostgreSQL with SQLAlchemy ORM
- **File Upload**: Secure file processing
- **API Documentation**: Auto-generated OpenAPI docs

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **AI/ML**: PyTorch, Transformers, Scikit-learn
- **Database**: PostgreSQL, SQLAlchemy, Alembic
- **Task Queue**: Celery, Redis
- **Monitoring**: Prometheus, Structlog
- **Security**: JWT, bcrypt, cryptography
- **Testing**: pytest, httpx

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL
- Redis
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb vista_db
   
   # Run migrations (if using Alembic)
   alembic upgrade head
   ```

## 🚀 Quick Start

### Development Mode
```bash
python start.py
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### With Docker
```bash
docker build -t vista-backend .
docker run -p 8000:8000 vista-backend
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### Analysis
- `POST /api/v1/analysis/text` - Text analysis
- `POST /api/v1/analysis/image` - Image analysis
- `POST /api/v1/analysis/ensemble` - Combined analysis
- `POST /api/v1/analysis/batch` - Batch processing
- `GET /api/v1/analysis/results/{result_id}` - Get analysis result

### System
- `GET /health` - Health check
- `GET /api/docs` - API documentation
- `GET /metrics` - Prometheus metrics

## 🤖 AI Models

### Text Analyzer
- **Model**: BERT (bert-base-uncased)
- **Features**: 768-dimensional embeddings
- **Capabilities**: Threat detection in text content

### Visual Analyzer
- **Model**: ResNet-50
- **Features**: 2048-dimensional features
- **Capabilities**: Malicious image detection

### Ensemble Analyzer
- **Model**: Random Forest + Voting Classifier
- **Features**: Combined text + visual + engineered features
- **Capabilities**: Comprehensive threat assessment

## 🔄 Background Tasks

The system uses Celery for background processing:

```bash
# Start Celery worker
celery -A app.core.celery_app worker --loglevel=info

# Start Celery beat (for scheduled tasks)
celery -A app.core.celery_app beat --loglevel=info
```

## 📈 Monitoring

### Prometheus Metrics
- Request counts and durations
- Analysis success/failure rates
- Threat detection counts
- System resource usage

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Performance monitoring

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_analysis.py
```

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- File type restrictions

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   └── analysis.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── monitoring.py
│   │   └── celery_app.py
│   ├── ml/
│   │   └── models/
│   │       ├── text_analyzer.py
│   │       ├── visual_analyzer.py
│   │       └── ensemble_analyzer.py
│   ├── models/
│   │   └── database.py
│   ├── tasks/
│   │   └── analysis_tasks.py
│   └── main.py
├── requirements.txt
├── Dockerfile
├── start.py
└── README.md
```

## 🐳 Docker

### Build Image
```bash
docker build -t vista-backend .
```

### Run Container
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379/0 \
  vista-backend
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔧 Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://vista_user:vista_pass@localhost:5432/vista_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` |
| `ENVIRONMENT` | Environment (dev/prod/test) | `development` |
| `MODEL_CACHE_DIR` | AI model storage directory | `models` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/docs`
- Review the logs for debugging information 
