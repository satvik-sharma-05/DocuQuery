from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.routes import auth, workspace, workspaces, documents, chat, analytics, slack, invitations, notifications
from app.core.config import settings
from app.models.database import db
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} API")
    logger.info(f"Environment: {settings.APP_ENV}")
    yield
    # Shutdown
    logger.info("Shutting down API")
    await db.close_pool()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Team-based RAG platform for document Q&A",
    version="1.0.0",
    lifespan=lifespan
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {process_time:.4f}s")
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(workspaces.router)  # New multi-workspace router
app.include_router(workspace.router)   # Legacy workspace router
app.include_router(invitations.router)  # NEW: Invitations
app.include_router(notifications.router)  # NEW: Notifications
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(slack.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": f"Welcome to {settings.APP_NAME} API"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "app": settings.APP_NAME}

@app.get("/test-cors")
async def test_cors():
    """Test CORS endpoint"""
    return {"message": "CORS is working"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development"
    )