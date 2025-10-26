import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables - try multiple locations
env_loaded = False

# Try loading from the same directory as this file
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    env_loaded = True
    print(f"✅ Loaded .env from: {env_path}")
else:
    # Fallback: try current working directory
    load_dotenv()
    env_loaded = True
    print(f"⚠️ Tried to load .env from current directory")

def get_supabase_client() -> Client:
    """Initialize and return Supabase client"""
    # Try both common naming conventions
    url = os.getenv("SUPABASE_URL") or os.getenv("SUPABASE_PROJECT_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    # Debug output
    print(f"🔍 Current working directory: {os.getcwd()}")
    print(f"🔍 Script location: {BASE_DIR}")
    print(f"🔍 .env file exists at script dir: {(BASE_DIR / '.env').exists()}")
    print(f"🔍 .env file exists at cwd: {Path(os.getcwd()) / '.env'}")
    print(f"🔍 supabase_config.py: SUPABASE_URL = {url}")
    print(f"🔍 supabase_config.py: SUPABASE_KEY exists = {bool(key)}")
    print(f"🔍 supabase_config.py: All env vars: {[k for k in os.environ.keys() if 'SUPABASE' in k]}")

    if not url or not key:
        print(
            "⚠️ Supabase credentials not found. Expected SUPABASE_URL and SUPABASE_KEY (or SUPABASE_ANON_KEY) in .env file"
        )
        return None
    
    # Check for placeholder values
    if url in ["your_supabase_project_url", "https://your-project-id.supabase.co"] or key in ["your_supabase_anon_key", "your_anon_key"]:
        print(
            "⚠️ Supabase credentials contain placeholder values. Please set real values in .env file"
        )
        return None

    try:
        return create_client(url, key)
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase client: {e}")
        return None


# Initialize Supabase client
supabase: Client = get_supabase_client()
