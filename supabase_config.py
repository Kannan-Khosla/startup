from supabase import create_client, Client
from config import settings
from logger import setup_logger

logger = setup_logger(__name__)


def get_supabase_client() -> Client:
    """Initialize and return Supabase client."""
    url = settings.supabase_url
    key = settings.supabase_key

    logger.info("Initializing Supabase client")
    
    # Check for placeholder values
    if url in ["your_supabase_project_url", "https://your-project-id.supabase.co"] or key in [
        "your_supabase_anon_key",
        "your_anon_key"
    ]:
        logger.error(
            "Supabase credentials contain placeholder values. Please set real values in .env file"
        )
        return None

    try:
        client = create_client(url, key)
        logger.info("Supabase client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


# Initialize Supabase client
supabase: Client = get_supabase_client()
