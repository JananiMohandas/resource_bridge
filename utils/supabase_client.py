from supabase import create_client, Client
from config import Config


class SupabaseClient:
    """Singleton Supabase client"""
    _instance = None
    _client: Client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize Supabase client"""
        Config.validate_config()
        self._client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

    @property
    def client(self) -> Client:
        return self._client

    def get_storage_bucket(self):
        return self._client.storage.from_(Config.STORAGE_BUCKET)

    # ================= FILE UPLOAD =================
    def upload_file(self, file_path: str, file_data: bytes, content_type: str = 'application/pdf'):
        bucket = self.get_storage_bucket()

        bucket.upload(
            file_path,
            file_data,
            file_options={"content-type": content_type}
        )

        public_url = bucket.get_public_url(file_path)
        return public_url

    # ================= RESOURCES =================
    def insert_resource(self, data: dict):
        response = self._client.table('resources').insert(data).execute()
        return response.data

    def get_resources(self, limit: int = 100):
        response = (
            self._client
            .table('resources')
            .select('*')
            .order('created_at', desc=True)
            .limit(limit)
            .execute()
        )
        return response.data

    def search_resources(self, query: str = None, tags: list = None):
        """
        Search resources by:
        - title (ilike)
        - description (ilike)
        - tags (contains)
        Compatible with supabase-py v1.0.3
        """

        query_builder = self._client.table('resources').select('*')

        # 🔎 SEARCH BY TEXT (TITLE OR DESCRIPTION)
        if query and query.strip() != "":
            search_term = f"%{query.strip()}%"

            # Use filter with raw PostgREST syntax
            query_builder = query_builder.filter(
                "or",
                "ilike",
                f"(title.ilike.{search_term},description.ilike.{search_term})"
            )

        # 🏷 FILTER BY TAGS
        if tags and len(tags) > 0:
            for tag in tags:
                query_builder = query_builder.contains("tags", [tag])

        response = query_builder.order("created_at", desc=True).execute()
        return response.data

    # ================= REQUESTS =================
    def insert_request(self, data: dict):
        response = self._client.table('requests').insert(data).execute()
        return response.data

    def get_requests(self):
        response = (
            self._client
            .table('requests')
            .select('*')
            .order('votes', desc=True)
            .execute()
        )
        return response.data

    def vote_request(self, request_id: str):
        # Get current votes
        response = (
            self._client
            .table('requests')
            .select('votes')
            .eq('id', request_id)
            .single()
            .execute()
        )

        current_votes = response.data['votes']

        # Update votes
        response = (
            self._client
            .table('requests')
            .update({'votes': current_votes + 1})
            .eq('id', request_id)
            .execute()
        )

        return response.data


# Create singleton instance
supabase_client = SupabaseClient()