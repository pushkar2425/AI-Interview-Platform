# AI Voice Interview Backend

A FastAPI backend for an AI-powered voice interview application using Google Gemini for feedback analysis.

## Features

- **User Authentication**: JWT-based authentication system
- **Interview Management**: Create, conduct, and analyze interviews
- **AI Feedback**: Powered by Google Gemini for intelligent analysis
- **RESTful API**: Clean and documented API endpoints
- **Database**: SQLite for development, easily extensible to PostgreSQL
- **CORS Support**: Configured for frontend integration

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-voice-interview-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the following variables:
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `JWT_SECRET`: Generate a secure random string

### 3. Run the Application

```bash
# Development server
uvicorn main:app --reload

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Key Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Interview Management
- `POST /api/interview/setup` - Create interview session
- `POST /api/interview/respond` - Submit interview response
- `POST /api/interview/complete` - Complete interview and get AI feedback
- `GET /api/interview/history` - Get user's interview history

## Deployment

### Heroku Deployment

1. **Prepare for Heroku**:
   ```bash
   # Login to Heroku
   heroku login

   # Create app
   heroku create your-app-name

   # Set environment variables
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set GEMINI_API_KEY=your-gemini-key
   ```

2. **Deploy**:
   ```bash
   git push heroku main
   ```

### Render Deployment

1. Connect your GitHub repository to Render
2. Choose "Web Service"
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Docker Deployment

```bash
# Build image
docker build -t ai-interview-api .

# Run container
docker run -p 8000:8000 -e GEMINI_API_KEY=your-key ai-interview-api

# Or use docker-compose
docker-compose up
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |
| `PORT` | Server port | No (defaults to 8000) |
| `HOST` | Server host | No (defaults to 0.0.0.0) |

## Database Schema

### Users Table
- `id`: Unique user identifier
- `email`: User email (unique)
- `password_hash`: Hashed password
- `name`: User display name
- `created_at`: Account creation timestamp

### Interview Sessions Table
- `id`: Session identifier
- `user_id`: Reference to user
- `interview_type`: Type of interview (Technical, Behavioral, General)
- `questions`: JSON array of questions
- `responses`: JSON array of user responses
- `feedback`: AI-generated feedback JSON
- `score`: Interview score (0-100)
- `status`: Session status (ready, in_progress, completed)
- `created_at`: Session creation timestamp
- `completed_at`: Session completion timestamp

## AI Integration

The application uses Google Gemini Pro for:
- Generating custom interview questions
- Analyzing user responses
- Providing detailed feedback and scoring

## Error Handling

The API includes comprehensive error handling:
- Input validation using Pydantic models
- JWT token validation and expiration
- Database connection error handling
- AI service error fallbacks

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- CORS configuration
- Input sanitization
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
