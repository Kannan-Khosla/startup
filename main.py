from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, HTTPException, status, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, EmailStr
from openai import OpenAI
from datetime import datetime, timedelta
from supabase_config import supabase
from config import settings
from logger import setup_logger
from middleware import error_handler, http_exception_handler, validation_exception_handler
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
import re
import time

# Set up logging
logger = setup_logger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=settings.openai_api_key)

# Create FastAPI app
app = FastAPI(title="AI Support API", version="1.0.0")

# Register error handlers
app.add_exception_handler(Exception, error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Bearer token security
security = HTTPBearer()


# ---------------------------
# 📦 MODELS
# ---------------------------


class TicketRequest(BaseModel):
    context: str
    subject: str
    message: str


class MessageRequest(BaseModel):
    message: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RatingRequest(BaseModel):
    message_id: str
    rating: int  # 1-5


class EscalateRequest(BaseModel):
    reason: str | None = None


class AdminReplyRequest(BaseModel):
    message: str


class AssignAdminRequest(BaseModel):
    admin_email: str


# ---------------------------
# 🧠 ROUTES
# ---------------------------


@app.get("/")
def health_check():
    """Simple health check.

    Returns
    -------
    dict
        `{ "message": "..." }` indicating the API is up.
    """
    return {"message": "AI Support API (threaded system) is running"}


# ---------------------------
# 🔐 AUTHENTICATION HELPERS
# ---------------------------
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role")
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    return {"id": user_id, "email": email, "role": role}


def get_current_customer(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user, ensuring they are a customer."""
    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for customers only",
        )
    return current_user


def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user, ensuring they are an admin."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ---------------------------
# 🔐 AUTHENTICATION ENDPOINTS
# ---------------------------
@app.post("/auth/register", response_model=Token)
def register(user_data: UserRegister):
    """Register a new customer account."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        # Check if user already exists
        existing = (
            supabase.table("users")
            .select("id")
            .eq("email", user_data.email.lower())
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Validate password length
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters",
            )
        if len(user_data.password.encode('utf-8')) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 bytes",
            )
        
        # Hash password and create user
        password_hash = get_password_hash(user_data.password)
        new_user = (
            supabase.table("users")
            .insert(
                {
                    "email": user_data.email.lower(),
                    "password_hash": password_hash,
                    "name": user_data.name,
                    "role": "customer",
                }
            )
            .execute()
        )
        
        user = new_user.data[0]
        user_id = user["id"]
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user_id, "email": user["email"], "role": user["role"]}
        )
        
        logger.info(f"New customer registered: {user['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin):
    """Login and get JWT token."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        # Find user
        user_res = (
            supabase.table("users")
            .select("*")
            .eq("email", credentials.email.lower())
            .limit(1)
            .execute()
        )
        
        if not user_res.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        user = user_res.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"], "role": user["role"]}
        )
        
        logger.info(f"User logged in: {user['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@app.get("/auth/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        user_res = (
            supabase.table("users")
            .select("id, email, name, role, created_at")
            .eq("id", current_user["id"])
            .limit(1)
            .execute()
        )
        
        if not user_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        user = user_res.data[0]
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "created_at": user["created_at"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user_info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user info",
        )


@app.post("/auth/admin/register", response_model=Token)
def register_admin(
    user_data: UserRegister, current_admin: dict = Depends(get_current_admin)
):
    """Register a new admin account (admin only)."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        # Check if user already exists
        existing = (
            supabase.table("users")
            .select("id")
            .eq("email", user_data.email.lower())
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Validate password length
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters",
            )
        if len(user_data.password.encode('utf-8')) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 bytes",
            )
        
        # Hash password and create admin user
        password_hash = get_password_hash(user_data.password)
        new_user = (
            supabase.table("users")
            .insert(
                {
                    "email": user_data.email.lower(),
                    "password_hash": password_hash,
                    "name": user_data.name,
                    "role": "admin",
                }
            )
            .execute()
        )
        
        user = new_user.data[0]
        user_id = user["id"]
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user_id, "email": user["email"], "role": user["role"]}
        )
        
        logger.info(f"New admin registered by {current_admin['email']}: {user['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register_admin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin registration failed",
        )


# ---------------------------
# 🔐 LEGACY ADMIN AUTH (kept for backward compatibility)
# ---------------------------
def require_admin(x_admin_token: str | None = Header(default=None)):
    """Validate admin token if configured."""
    if not settings.admin_token:
        # If no token configured, allow all (dev mode)
        logger.warning("Admin token not configured - admin endpoints are unprotected")
        return
    if x_admin_token != settings.admin_token:
        logger.warning(f"Invalid admin token attempt from {x_admin_token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin token",
        )


# ---------------------------
# 🛡️ RELIABILITY & GUARDRAILS
# ---------------------------
def is_rate_limited(ticket_id: str) -> tuple[bool, dict]:
    """Check if ticket has exceeded AI reply rate limit."""
    try:
        window_start = (
            datetime.utcnow() - timedelta(seconds=settings.ai_reply_window_seconds)
        ).isoformat()
        count = (
            supabase.table("messages")
            .select("id", count="exact")
            .eq("ticket_id", ticket_id)
            .eq("sender", "ai")
            .gte("created_at", window_start)
            .execute()
            .count
        )
        limited = count >= settings.ai_reply_max_per_window
        if limited:
            logger.warning(
                f"Rate limit exceeded for ticket {ticket_id}: {count} replies in window"
            )
        return limited, {"ai_replies_in_window": count}
    except Exception as e:
        logger.error(f"Error checking rate limit for ticket {ticket_id}: {e}")
        return False, {}


PROFANITY = re.compile(r"\b(fuck|shit|bitch|asshole)(?:ing|s|ed)?\b", re.IGNORECASE)
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"(?:\+?\d[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}")
CC = re.compile(r"\b(?:\d[ -]*?){13,19}\b")


def sanitize_output(text: str) -> tuple[str, dict]:
    redacted = text or ""
    flags = {"profanity": False, "email": False, "phone": False, "cc": False}
    if PROFANITY.search(redacted):
        flags["profanity"] = True
        redacted = PROFANITY.sub("***", redacted)
    if EMAIL.search(redacted):
        flags["email"] = True
        redacted = EMAIL.sub("***@***.***", redacted)
    # Check CC before PHONE to avoid phone regex matching credit card numbers
    if CC.search(redacted):
        flags["cc"] = True
        redacted = CC.sub("**** **** **** ****", redacted)
    if PHONE.search(redacted):
        flags["phone"] = True
        redacted = PHONE.sub("***-***-****", redacted)
    return redacted, flags


def generate_ai_reply(prompt: str) -> str:
    """
    Generate AI reply with exponential backoff retry logic.
    
    Parameters
    ----------
    prompt : str
        The prompt to send to OpenAI
    
    Returns
    -------
    str
        The generated AI reply
    
    Raises
    ------
    Exception
        If all retry attempts fail
    """
    delay = settings.openai_initial_delay
    max_retries = settings.openai_max_retries
    
    for attempt in range(max_retries + 1):
        try:
            logger.debug(f"Calling OpenAI API (attempt {attempt + 1}/{max_retries + 1})")
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
            )
            response = completion.choices[0].message.content
            logger.debug("OpenAI API call successful")
            return response
        except Exception as e:
            if attempt < max_retries:
                logger.warning(
                    f"OpenAI API call failed (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                    f"Retrying in {delay:.2f}s..."
                )
                time.sleep(delay)
                delay *= settings.openai_backoff_multiplier
            else:
                logger.error(f"OpenAI API call failed after {max_retries + 1} attempts: {e}")
                raise e


# ---------------------------------------------------
# POST /ticket → Create or reuse ticket, AI replies
# ---------------------------------------------------
@app.post("/ticket")
def create_or_continue_ticket(
    req: TicketRequest, current_user: dict = Depends(get_current_customer)
):
    """Create or continue a ticket and optionally generate an AI reply.

    Parameters
    ----------
    req : TicketRequest
        `{ context, subject, message }`
    current_user : dict
        Current authenticated customer

    Returns
    -------
    dict
        `{ ticket_id, reply? }` or `{ ticket_id, rate_limited, wait_seconds }`
    """
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        user_id = current_user["id"]
        
        # 1️⃣ Find open ticket with same context & subject for this user
        existing = (
            supabase.table("tickets")
            .select("*")
            .eq("context", req.context)
            .eq("subject", req.subject)
            .eq("status", "open")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            ticket = existing.data[0]
            ticket_id = ticket["id"]
            logger.info(f"Continuing existing ticket: {ticket_id}")
        else:
            # Create new ticket
            new_ticket = (
                supabase.table("tickets")
                .insert(
                    {
                        "context": req.context,
                        "subject": req.subject,
                        "status": "open",
                        "user_id": user_id,
                        "created_at": datetime.utcnow().isoformat(),
                    }
                )
                .execute()
            )
            ticket = new_ticket.data[0]
            ticket_id = ticket["id"]
            logger.info(f"Created new ticket: {ticket_id}")

        # 2️⃣ Add customer message
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "customer",
                "message": req.message,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()

        # 3️⃣ Check if human is assigned — skip AI if true
        if ticket.get("assigned_to"):
            logger.info(
                f"Human agent assigned ({ticket['assigned_to']}), skipping AI reply for ticket {ticket_id}"
            )
            return {
                "ticket_id": ticket_id,
                "reply": f"Human agent {ticket['assigned_to']} will handle this ticket.",
            }

        # 4️⃣ Fetch full message history for context
        history = (
            supabase.table("messages")
            .select("sender, message")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=False)
            .execute()
        )
        conversation_history = "\n".join(
            [f"{m['sender'].capitalize()}: {m['message']}" for m in history.data]
        )

        # 5️⃣ Generate AI reply
        prompt = f"""
        You are an AI support assistant for {req.context}.
        Continue the following ticket conversation helpfully and politely.
        ----
        {conversation_history}
        ----
        Reply as the assistant:
        """

        # 5.1️⃣ Rate limit check
        limited, _meta = is_rate_limited(ticket_id)
        if limited:
            return {
                "ticket_id": ticket_id,
                "rate_limited": True,
                "wait_seconds": settings.ai_reply_window_seconds,
            }

        # 5.2️⃣ Generate AI reply with retry/backoff
        logger.info(f"Generating AI reply for ticket {ticket_id}")
        raw_answer = generate_ai_reply(prompt)

        # 5.3️⃣ Sanitize output for profanity/PII
        answer, flags = sanitize_output(raw_answer)

        # 6️⃣ Store AI reply
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "ai",
                "message": answer,
                "confidence": 0.95,
                "success": True,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()

        return {"ticket_id": ticket_id, "reply": answer}

    except Exception as e:
        logger.error(f"Error in create_or_continue_ticket: {e}", exc_info=True)
        raise


# ---------------------------------------------------
# POST /ticket/{ticket_id}/reply → Continue thread
# ---------------------------------------------------
@app.post("/ticket/{ticket_id}/reply")
def reply_to_existing_ticket(
    ticket_id: str, req: MessageRequest, current_user: dict = Depends(get_current_customer)
):
    """Append a customer message and optionally generate an AI reply.

    If a human is assigned, AI reply is skipped.
    Rate limiting and output sanitization apply if AI is used.
    """
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        user_id = current_user["id"]
        
        # 1️⃣ Verify ticket exists and belongs to user
        ticket_res = (
            supabase.table("tickets").select("*").eq("id", ticket_id).limit(1).execute()
        )
        if not ticket_res.data:
            return {"error": f"Ticket {ticket_id} not found."}

        ticket = ticket_res.data[0]
        
        # Verify ticket belongs to current user
        if ticket.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this ticket",
            )

        # 2️⃣ Store new customer message
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "customer",
                "message": req.message,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()

        # 3️⃣ If human assigned, skip AI
        if ticket.get("assigned_to"):
            logger.info(
                f"Human assigned ({ticket['assigned_to']}), skipping AI for ticket {ticket_id}"
            )
            return {
                "ticket_id": ticket_id,
                "reply": f"Human agent {ticket['assigned_to']} will handle this.",
            }

        # 4️⃣ Fetch all messages
        history = (
            supabase.table("messages")
            .select("sender, message")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=False)
            .execute()
        )
        conversation_history = "\n".join(
            [f"{m['sender'].capitalize()}: {m['message']}" for m in history.data]
        )

        # 5️⃣ Generate AI reply
        prompt = f"""
        You are an AI assistant continuing this customer support thread.
        ----
        {conversation_history}
        ----
        Respond concisely and politely as the assistant.
        """

        # 5.1️⃣ Rate limit check
        limited, _meta = is_rate_limited(ticket_id)
        if limited:
            return {
                "ticket_id": ticket_id,
                "rate_limited": True,
                "wait_seconds": settings.ai_reply_window_seconds,
            }

        # 5.2️⃣ Generate AI reply with retry/backoff
        raw_answer = generate_ai_reply(prompt)

        # 5.3️⃣ Sanitize output for profanity/PII
        answer, flags = sanitize_output(raw_answer)

        # 6️⃣ Store AI reply
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "ai",
                "message": answer,
                "confidence": 0.95,
                "success": True,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()

        return {"ticket_id": ticket_id, "reply": answer}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reply_to_existing_ticket: {e}", exc_info=True)
        raise


# ---------------------------------------------------
# POST /ticket/{ticket_id}/rate → Rate an AI response
# ---------------------------------------------------
@app.post("/ticket/{ticket_id}/rate")
def rate_ai_response(
    ticket_id: str,
    req: RatingRequest,
    current_user: dict = Depends(get_current_customer),
):
    """Rate an AI response message."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        user_id = current_user["id"]
        
        # Validate rating
        if req.rating < 1 or req.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 1 and 5",
            )
        
        # Verify ticket exists and belongs to user
        ticket_res = (
            supabase.table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .limit(1)
            .execute()
        )
        if not ticket_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        ticket = ticket_res.data[0]
        if ticket.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this ticket",
            )
        
        # Verify message exists and is an AI response
        message_res = (
            supabase.table("messages")
            .select("*")
            .eq("id", req.message_id)
            .eq("ticket_id", ticket_id)
            .limit(1)
            .execute()
        )
        if not message_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
        message = message_res.data[0]
        if message.get("sender") != "ai":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only AI messages can be rated",
            )
        
        # Check if user already rated this message
        existing_rating = (
            supabase.table("ratings")
            .select("*")
            .eq("ticket_id", ticket_id)
            .eq("message_id", req.message_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if existing_rating.data:
            # Update existing rating
            supabase.table("ratings").update({"rating": req.rating}).eq(
                "id", existing_rating.data[0]["id"]
            ).execute()
            logger.info(f"Updated rating for message {req.message_id} by user {user_id}")
        else:
            # Create new rating
            supabase.table("ratings").insert(
                {
                    "ticket_id": ticket_id,
                    "message_id": req.message_id,
                    "user_id": user_id,
                    "rating": req.rating,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ).execute()
            logger.info(f"Created rating for message {req.message_id} by user {user_id}")
        
        return {"success": True, "message": "Rating saved"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in rate_ai_response: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save rating",
        )


# ---------------------------------------------------
# POST /ticket/{ticket_id}/escalate → Request human support
# ---------------------------------------------------
@app.post("/ticket/{ticket_id}/escalate")
def escalate_to_human(
    ticket_id: str,
    req: EscalateRequest,
    current_user: dict = Depends(get_current_customer),
):
    """Request human support for a ticket."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        user_id = current_user["id"]
        
        # Verify ticket exists and belongs to user
        ticket_res = (
            supabase.table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .limit(1)
            .execute()
        )
        if not ticket_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        ticket = ticket_res.data[0]
        if ticket.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this ticket",
            )
        
        # Check if escalation already exists
        existing_escalation = (
            supabase.table("human_escalations")
            .select("*")
            .eq("ticket_id", ticket_id)
            .eq("user_id", user_id)
            .execute()
        )
        
        if existing_escalation.data:
            escalation = existing_escalation.data[0]
            if escalation["status"] != "resolved":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Human support already requested for this ticket",
                )
        
        # Create escalation
        supabase.table("human_escalations").insert(
            {
                "ticket_id": ticket_id,
                "user_id": user_id,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        
        # Update ticket status
        supabase.table("tickets").update(
            {"status": "human_assigned", "updated_at": datetime.utcnow().isoformat()}
        ).eq("id", ticket_id).execute()
        
        # Add system message
        escalation_message = "Customer requested to connect with a human agent."
        if req.reason:
            escalation_message += f" Reason: {req.reason}"
        
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "system",
                "message": escalation_message,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        
        logger.info(f"Ticket {ticket_id} escalated to human by user {user_id}")
        
        return {
            "success": True,
            "message": "Human support requested. An agent will assist you shortly.",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in escalate_to_human: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to escalate ticket",
        )


# ---------------------------------------------------
# GET /ticket/{ticket_id} → Fetch full thread
# ---------------------------------------------------
@app.get("/ticket/{ticket_id}")
def get_ticket_thread(
    ticket_id: str, current_user: dict = Depends(get_current_user)
):
    """Fetch a ticket and its full message thread ordered by time."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        ticket = (
            supabase.table("tickets").select("*").eq("id", ticket_id).limit(1).execute()
        )
        if not ticket.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        
        ticket_data = ticket.data[0]
        user_id = current_user["id"]
        user_role = current_user["role"]
        
        # Verify access: customers can only see their tickets, admins can see all
        if user_role == "customer" and ticket_data.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this ticket",
            )
        
        messages = (
            supabase.table("messages")
            .select("*")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=False)
            .execute()
        )
        
        # Get ratings for AI messages
        ratings = (
            supabase.table("ratings")
            .select("*")
            .eq("ticket_id", ticket_id)
            .eq("user_id", user_id)
            .execute()
        )
        ratings_map = {r["message_id"]: r["rating"] for r in ratings.data}
        
        # Attach ratings to messages
        messages_with_ratings = messages.data.copy()
        for msg in messages_with_ratings:
            msg["user_rating"] = ratings_map.get(msg["id"])
        
        return {
            "ticket": ticket_data,
            "messages": messages_with_ratings,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_ticket_thread: {e}", exc_info=True)
        raise


# ---------------------------------------------------
# GET /stats → Ticket summary
# ---------------------------------------------------
@app.get("/stats")
def get_stats():
    """Fetch ticket metrics and a sample from the `ticket_summary` view."""
    try:
        total = supabase.table("tickets").select("id", count="exact").execute().count
        open_t = (
            supabase.table("tickets")
            .select("id", count="exact")
            .eq("status", "open")
            .execute()
            .count
        )
        closed_t = total - open_t

        summary = (
            supabase.table("ticket_summary")
            .select(
                "ticket_id, context, subject, status, total_messages, avg_confidence"
            )
            .limit(5)
            .execute()
        )

        return {
            "total_tickets": total,
            "open_tickets": open_t,
            "closed_tickets": closed_t,
            "sample_summary": summary.data,
        }

    except Exception as e:
        logger.error(f"Error in get_stats: {e}", exc_info=True)
        raise


# ---------------------------------------------------
# ADMIN ENDPOINTS
# ---------------------------------------------------
@app.get("/admin/tickets")
def admin_get_all_tickets(
    status: str = None, current_admin: dict = Depends(get_current_admin)
):
    """List all tickets, optionally filtered by `status`."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        query = supabase.table("tickets").select("*").order("updated_at", desc=True)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        return {"tickets": res.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin_get_all_tickets: {e}", exc_info=True)
        raise


@app.get("/admin/tickets/assigned")
def get_assigned_tickets(current_admin: dict = Depends(get_current_admin)):
    """Get tickets assigned to the current admin."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        admin_email = current_admin["email"]
        res = (
            supabase.table("tickets")
            .select("*")
            .eq("assigned_to", admin_email)
            .order("updated_at", desc=True)
            .execute()
        )
        return {"tickets": res.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_assigned_tickets: {e}", exc_info=True)
        raise


@app.get("/customer/tickets")
def get_customer_tickets(current_user: dict = Depends(get_current_customer)):
    """Get all tickets for the current customer."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        user_id = current_user["id"]
        res = (
            supabase.table("tickets")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return {"tickets": res.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_customer_tickets: {e}", exc_info=True)
        raise


@app.post("/ticket/{ticket_id}/admin/reply")
def admin_reply_to_ticket(
    ticket_id: str,
    req: AdminReplyRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Admin reply to a ticket."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        # Verify ticket exists
        ticket_res = (
            supabase.table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .limit(1)
            .execute()
        )
        if not ticket_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        
        ticket = ticket_res.data[0]
        
        # Store admin message
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "admin",
                "message": req.message,
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        
        # Update ticket status if needed
        if ticket.get("status") == "open":
            supabase.table("tickets").update(
                {
                    "status": "human_assigned",
                    "assigned_to": current_admin["email"],
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).eq("id", ticket_id).execute()
        
        logger.info(f"Admin {current_admin['email']} replied to ticket {ticket_id}")
        
        return {"success": True, "message": "Reply sent"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin_reply_to_ticket: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reply",
        )


@app.post("/admin/ticket/{ticket_id}/assign-admin")
def assign_ticket_to_admin(
    ticket_id: str,
    req: AssignAdminRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Assign a ticket to another admin."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        # Verify ticket exists
        ticket_res = (
            supabase.table("tickets")
            .select("*")
            .eq("id", ticket_id)
            .limit(1)
            .execute()
        )
        if not ticket_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )
        
        # Verify admin exists
        admin_res = (
            supabase.table("users")
            .select("*")
            .eq("email", req.admin_email.lower())
            .eq("role", "admin")
            .limit(1)
            .execute()
        )
        if not admin_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found",
            )
        
        # Update ticket
        supabase.table("tickets").update(
            {
                "assigned_to": req.admin_email.lower(),
                "status": "human_assigned",
                "updated_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", ticket_id).execute()
        
        # Add system message
        supabase.table("messages").insert(
            {
                "ticket_id": ticket_id,
                "sender": "system",
                "message": f"Ticket assigned to {req.admin_email} by {current_admin['email']}",
                "created_at": datetime.utcnow().isoformat(),
            }
        ).execute()
        
        logger.info(f"Ticket {ticket_id} assigned to {req.admin_email} by {current_admin['email']}")
        
        return {
            "success": True,
            "message": f"Ticket assigned to {req.admin_email}",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in assign_ticket_to_admin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign ticket",
        )


@app.post("/admin/ticket/{ticket_id}/assign")
def assign_agent(
    ticket_id: str, agent_name: str, _: None = Depends(require_admin)
):
    """Assign a human agent and move ticket to `human_assigned` (legacy endpoint)."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        supabase.table("tickets").update(
            {"assigned_to": agent_name, "status": "human_assigned"}
        ).eq("id", ticket_id).execute()
        return {
            "success": True,
            "message": f"Ticket {ticket_id} assigned to {agent_name}",
        }
    except Exception as e:
        logger.error(f"Error in assign_agent: {e}", exc_info=True)
        raise


@app.post("/admin/ticket/{ticket_id}/close")
def close_ticket(
    ticket_id: str, current_admin: dict = Depends(get_current_admin)
):
    """Mark the ticket `closed`."""
    try:
        if supabase is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not configured",
            )
        
        supabase.table("tickets").update(
            {"status": "closed", "updated_at": datetime.utcnow().isoformat()}
        ).eq("id", ticket_id).execute()
        
        logger.info(f"Ticket {ticket_id} closed by admin {current_admin['email']}")
        
        return {"success": True, "message": f"Ticket {ticket_id} closed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in close_ticket: {e}", exc_info=True)
        raise
