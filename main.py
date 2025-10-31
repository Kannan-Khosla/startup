from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, HTTPException, status, Depends
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel
from openai import OpenAI
from datetime import datetime, timedelta
from supabase_config import supabase
from config import settings
from logger import setup_logger
from middleware import error_handler, http_exception_handler, validation_exception_handler
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


# ---------------------------
# 📦 MODELS
# ---------------------------


class TicketRequest(BaseModel):
    context: str
    subject: str
    message: str


class MessageRequest(BaseModel):
    message: str


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
# 🔐 ADMIN AUTH
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
def create_or_continue_ticket(req: TicketRequest):
    """Create or continue a ticket and optionally generate an AI reply.

    Parameters
    ----------
    req : TicketRequest
        `{ context, subject, message }`

    Returns
    -------
    dict
        `{ ticket_id, reply? }` or `{ ticket_id, rate_limited, wait_seconds }`
    """
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        # 1️⃣ Find open ticket with same context & subject
        existing = (
            supabase.table("tickets")
            .select("*")
            .eq("context", req.context)
            .eq("subject", req.subject)
            .eq("status", "open")
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
def reply_to_existing_ticket(ticket_id: str, req: MessageRequest):
    """Append a customer message and optionally generate an AI reply.

    If a human is assigned, AI reply is skipped.
    Rate limiting and output sanitization apply if AI is used.
    """
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        # 1️⃣ Verify ticket exists
        ticket_res = (
            supabase.table("tickets").select("*").eq("id", ticket_id).limit(1).execute()
        )
        if not ticket_res.data:
            return {"error": f"Ticket {ticket_id} not found."}

        ticket = ticket_res.data[0]

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

    except Exception as e:
        logger.error(f"Error in reply_to_existing_ticket: {e}", exc_info=True)
        raise


# ---------------------------------------------------
# GET /ticket/{ticket_id} → Fetch full thread
# ---------------------------------------------------
@app.get("/ticket/{ticket_id}")
def get_ticket_thread(ticket_id: str):
    """Fetch a ticket and its full message thread ordered by time."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        ticket = (
            supabase.table("tickets").select("*").eq("id", ticket_id).limit(1).execute()
        )
        messages = (
            supabase.table("messages")
            .select("*")
            .eq("ticket_id", ticket_id)
            .order("created_at", desc=False)
            .execute()
        )
        return {
            "ticket": ticket.data[0] if ticket.data else {},
            "messages": messages.data,
        }
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


@app.get("/admin/tickets")
def admin_get_all_tickets(status: str = None):
    """List all tickets, optionally filtered by `status`."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        query = supabase.table("tickets").select("*").order("updated_at", desc=True)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        return {"tickets": res.data}
    except Exception as e:
        logger.error(f"Error in admin_get_all_tickets: {e}", exc_info=True)
        raise


@app.post("/admin/ticket/{ticket_id}/assign")
def assign_agent(ticket_id: str, agent_name: str, _: None = Depends(require_admin)):
    """Assign a human agent and move ticket to `human_assigned`."""
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
def close_ticket(ticket_id: str, _: None = Depends(require_admin)):
    """Mark the ticket `closed`. Requires admin token if configured."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        supabase.table("tickets").update(
            {"status": "closed", "updated_at": datetime.utcnow().isoformat()}
        ).eq("id", ticket_id).execute()
        return {"success": True, "message": f"Ticket {ticket_id} closed successfully"}
    except Exception as e:
        logger.error(f"Error in close_ticket: {e}", exc_info=True)
        raise
