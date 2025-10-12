from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use environment variable for API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SupportRequest(BaseModel):
    context: str
    message: str


@app.post("/reply")
def reply(req: SupportRequest):
    prompt = f"""
    You are a helpful customer support assistant.
    Context: {req.context}
    Customer message: {req.message}
    """

    # Debug: Print received request
    print("\n" + "=" * 50)
    print("🔍 DEBUG: Request received")
    print("=" * 50)
    print(f"📝 Context: {req.context}")
    print(f"💬 Message: {req.message}")
    print(f"📋 Full Prompt:\n{prompt}")
    print("=" * 50)

    try:
        print("🤖 Calling OpenAI API...")
        completion = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
        )
        answer = completion.choices[0].message.content

        # Debug: Print response
        print("✅ OpenAI Response:")
        print(f"📤 Answer: {answer}")
        print("=" * 50 + "\n")

        return {"reply": answer}
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"❌ ERROR: {error_msg}")
        print("=" * 50 + "\n")
        return {"reply": error_msg}


@app.get("/")
def read_root():
    return {"message": "AI Support API is running"}
