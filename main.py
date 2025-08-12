from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import jwt
import bcrypt
import sqlite3
import uuid
from datetime import datetime, timedelta
import google.generativeai as genai
import os
from dotenv import load_dotenv
import asyncio
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Voice Interview API",
    description="Backend API for AI-powered voice interview application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Database initialization
def init_db():
    conn = sqlite3.connect('interview_app.db')
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Interview sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            interview_type TEXT NOT NULL,
            questions TEXT NOT NULL,
            responses TEXT,
            feedback TEXT,
            score INTEGER,
            duration INTEGER,
            status TEXT DEFAULT 'in_progress',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class InterviewSetup(BaseModel):
    interview_type: str
    question_count: int
    custom_questions: Optional[List[str]] = None

class InterviewResponse(BaseModel):
    session_id: str
    question_index: int
    question: str
    response_text: str
    response_duration: int

class InterviewCompletion(BaseModel):
    session_id: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Sample interview questions
SAMPLE_QUESTIONS = {
    "Technical": [
        "Explain a complex technical problem you solved recently.",
        "How do you approach debugging a difficult issue?",
        "Describe your experience with system design.",
        "What programming languages are you most comfortable with?",
        "How do you ensure code quality in your projects?"
    ],
    "Behavioral": [
        "Tell me about yourself and your background.",
        "Describe a challenging situation you faced at work and how you handled it.",
        "What are your greatest strengths and how do they apply to this role?",
        "Where do you see yourself in 5 years?",
        "Why do you want to work for our company?"
    ],
    "General": [
        "What motivates you in your work?",
        "How do you handle stress and pressure?",
        "Describe a time when you had to work with a difficult team member.",
        "What is your biggest professional achievement?",
        "What is your biggest weakness and how are you working to improve it?"
    ]
}

# API Routes

@app.get("/")
async def root():
    return {"message": "AI Voice Interview API is running"}

@app.post("/api/auth/register")
async def register_user(user: UserCreate):
    try:
        conn = sqlite3.connect('interview_app.db')
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user
        user_id = str(uuid.uuid4())
        password_hash = hash_password(user.password)

        cursor.execute(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
            (user_id, user.email, password_hash, user.name)
        )
        conn.commit()
        conn.close()

        # Create JWT token
        token = create_jwt_token(user_id, user.email)

        return {
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "name": user.name,
                "email": user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_user(user: UserLogin):
    try:
        conn = sqlite3.connect('interview_app.db')
        cursor = conn.cursor()

        cursor.execute("SELECT id, password_hash, name FROM users WHERE email = ?", (user.email,))
        db_user = cursor.fetchone()
        conn.close()

        if not db_user or not verify_password(user.password, db_user[1]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_jwt_token(db_user[0], user.email)

        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": db_user[0],
                "name": db_user[2],
                "email": user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/setup")
async def setup_interview(setup: InterviewSetup, current_user: dict = Depends(verify_jwt_token)):
    try:
        # Generate questions based on type or use custom ones
        if setup.custom_questions:
            questions = setup.custom_questions[:setup.question_count]
        else:
            available_questions = SAMPLE_QUESTIONS.get(setup.interview_type, SAMPLE_QUESTIONS["General"])
            questions = available_questions[:setup.question_count]

        # Create interview session
        session_id = str(uuid.uuid4())
        conn = sqlite3.connect('interview_app.db')
        cursor = conn.cursor()

        cursor.execute(
            """INSERT INTO interview_sessions 
               (id, user_id, interview_type, questions, status) 
               VALUES (?, ?, ?, ?, 'ready')""",
            (session_id, current_user["user_id"], setup.interview_type, json.dumps(questions))
        )
        conn.commit()
        conn.close()

        return {
            "session_id": session_id,
            "questions": questions,
            "interview_type": setup.interview_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/complete")
async def complete_interview(completion: InterviewCompletion, current_user: dict = Depends(verify_jwt_token)):
    try:
        conn = sqlite3.connect('interview_app.db')
        cursor = conn.cursor()

        # Get interview data
        cursor.execute(
            "SELECT questions, responses FROM interview_sessions WHERE id = ? AND user_id = ?",
            (completion.session_id, current_user["user_id"])
        )
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Interview session not found")

        questions = json.loads(result[0])
        responses = json.loads(result[1]) if result[1] else []

        # Generate AI feedback using Gemini
        feedback_prompt = f"""
        Please analyze this interview performance and provide constructive feedback:

        Questions and Responses:
        {json.dumps([{"question": q, "response": r.get("response_text", "")} for q, r in zip(questions, responses)], indent=2)}

        Please provide:
        1. Overall assessment (2-3 sentences)
        2. Strengths identified (list of 2-3 items)
        3. Areas for improvement (list of 2-3 items)
        4. Specific suggestions (list of 2-3 actionable items)
        5. A score out of 100

        Format your response as JSON with keys: assessment, strengths, improvements, suggestions, score
        """

        try:
            gemini_response = model.generate_content(feedback_prompt)
            feedback_text = gemini_response.text

            # Try to clean and parse the JSON response
            feedback_text = feedback_text.strip()
            if feedback_text.startswith('```json'):
                feedback_text = feedback_text[7:]
            if feedback_text.endswith('```'):
                feedback_text = feedback_text[:-3]

            try:
                feedback_json = json.loads(feedback_text)
                score = int(feedback_json.get("score", 75))
            except:
                # If JSON parsing fails, create a structured response
                feedback_json = {
                    "assessment": "Interview completed successfully. Responses showed good understanding of the questions and professional communication.",
                    "strengths": ["Clear communication", "Professional demeanor", "Engaged throughout the process"],
                    "improvements": ["Could provide more specific examples", "Consider elaborating on technical details"],
                    "suggestions": ["Practice behavioral questions with STAR method", "Prepare more concrete examples", "Work on concise storytelling"],
                    "score": 75
                }
                score = 75

        except Exception as ai_error:
            print(f"Gemini AI error: {ai_error}")
            feedback_json = {
                "assessment": "Interview completed successfully. Thank you for participating in the mock interview session.",
                "strengths": ["Completed all questions", "Maintained professional tone", "Engaged throughout the process"],
                "improvements": ["Continue practicing to improve confidence", "Work on providing more detailed responses"],
                "suggestions": ["Record practice sessions for self-review", "Research common interview questions", "Practice with a timer"],
                "score": 70
            }
            score = 70

        # Update interview session
        cursor.execute(
            """UPDATE interview_sessions 
               SET status = 'completed', feedback = ?, score = ?, completed_at = CURRENT_TIMESTAMP 
               WHERE id = ?""",
            (json.dumps(feedback_json), score, completion.session_id)
        )
        conn.commit()
        conn.close()

        return {
            "message": "Interview completed successfully",
            "feedback": feedback_json,
            "score": score,
            "session_id": completion.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
