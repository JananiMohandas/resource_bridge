import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    #SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'mysecret123')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Supabase Storage
    STORAGE_BUCKET = 'resources'
    
    # File upload settings
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf'}
    
    @staticmethod
    def validate_config():
        """Validate that required environment variables are set"""
        if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
            raise ValueError(
                "Missing required environment variables. "
                "Please set SUPABASE_URL and SUPABASE_KEY in .env file"
            )