from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase_config import supabase

# Load environment variables - explicit path
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ main.py: Loaded .env from: {env_path}")
else:
    load_dotenv()
    print(f"⚠️ main.py: No .env found at {env_path}")

# Debug: Print environment variables
print("🔍 Checking environment variables...")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY exists: {bool(os.getenv('SUPABASE_KEY'))}")
print(f"OPENAI_API_KEY exists: {bool(os.getenv('OPENAI_API_KEY'))}")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = FastAPI()

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
    return {"message": "AI Support API (threaded system) is running"}


# ---------------------------------------------------
# POST /ticket → Create or reuse ticket, AI replies
# ---------------------------------------------------
@app.post("/ticket")
def create_or_continue_ticket(req: TicketRequest):
    """
    Create a new ticket (if not exists) or continue an open one.
    AI replies only if no human agent is assigned.
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
            print(f"🧾 Continuing existing ticket: {ticket_id}")
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
            print(f"🆕 Created new ticket: {ticket_id}")

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
            print(
                f"🙋 Human agent assigned ({ticket['assigned_to']}), skipping AI reply."
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

        print("🤖 Calling OpenAI model...")
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        answer = completion.choices[0].message.content

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
        print(f"❌ ERROR: {e}")
        return {"error": str(e)}


# ---------------------------------------------------
# POST /ticket/{ticket_id}/reply → Continue thread
# ---------------------------------------------------
@app.post("/ticket/{ticket_id}/reply")
def reply_to_existing_ticket(ticket_id: str, req: MessageRequest):
    """
    Continue an existing thread (customer follow-up).
    AI replies if ticket is unassigned to a human.
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
            print(f"🙋 Human assigned ({ticket['assigned_to']}), skipping AI.")
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

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        answer = completion.choices[0].message.content

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
        return {"error": str(e)}


# ---------------------------------------------------
# GET /ticket/{ticket_id} → Fetch full thread
# ---------------------------------------------------
@app.get("/ticket/{ticket_id}")
def get_ticket_thread(ticket_id: str):
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
        return {"error": str(e)}


# ---------------------------------------------------
# GET /stats → Ticket summary
# ---------------------------------------------------
@app.get("/stats")
def get_stats():
    """Fetch ticket metrics from Supabase view."""
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
        return {"error": f"Failed to fetch stats: {str(e)}"}


@app.get("/admin/tickets")
def admin_get_all_tickets(status: str = None):
    """List all tickets, filter by status if given."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        query = supabase.table("tickets").select("*").order("updated_at", desc=True)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        return {"tickets": res.data}
    except Exception as e:
        return {"error": str(e)}


@app.post("/admin/ticket/{ticket_id}/assign")
def assign_agent(ticket_id: str, agent_name: str):
    """Assign a human agent and disable AI replies."""
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
        return {"error": str(e)}


@app.post("/admin/ticket/{ticket_id}/close")
def close_ticket(ticket_id: str):
    """Mark ticket as closed."""
    try:
        if supabase is None:
            return {"error": "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file"}
        
        supabase.table("tickets").update(
            {"status": "closed", "updated_at": datetime.utcnow().isoformat()}
        ).eq("id", ticket_id).execute()
        return {"success": True, "message": f"Ticket {ticket_id} closed successfully"}
    except Exception as e:
        return {"error": str(e)}
