from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
import os
from datetime import datetime
from config import Config
from utils.supabase_client import supabase_client

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

# ============= Routes =============

@app.route('/')
def index():
    """Landing page with role selection"""
    return render_template('index.html')

@app.route('/teacher')
def teacher_dashboard():
    """Teacher dashboard page"""
    return render_template('teacher.html')

@app.route('/student')
def student_dashboard():
    """Student dashboard page"""
    return render_template('student.html')

# ============= API Endpoints =============

@app.route('/api/upload-resource', methods=['POST'])
def upload_resource():
    """
    Upload a resource (PDF) with metadata
    
    Form data:
        - file: PDF file
        - title: Resource title
        - description: Resource description
        - tags: Comma-separated tags
        - uploaded_by: Teacher name
    """
    try:
        # Validate file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Get form data
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        tags_string = request.form.get('tags', '').strip()
        uploaded_by = request.form.get('uploaded_by', 'Anonymous').strip()
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        # Process tags
        tags = [tag.strip() for tag in tags_string.split(',') if tag.strip()]
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        
        # Read file data
        file_data = file.read()
        
        # Check file size
        if len(file_data) > Config.MAX_FILE_SIZE:
            return jsonify({'error': 'File size exceeds 10MB limit'}), 400
        
        # Upload to Supabase Storage
        file_url = supabase_client.upload_file(
            unique_filename,
            file_data,
            content_type='application/pdf'
        )
        
        # Insert resource metadata into database
        resource_data = {
            'title': title,
            'description': description,
            'tags': tags,
            'file_url': file_url,
            'uploaded_by': uploaded_by,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.insert_resource(resource_data)
        
        return jsonify({
            'message': 'Resource uploaded successfully',
            'resource': result[0] if result else resource_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get all resources sorted by latest"""
    try:
        resources = supabase_client.get_resources()
        return jsonify({'resources': resources}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_resources():
    """
    Search resources by title or filter by tags
    
    Query params:
        - q: Search query (searches in title and description)
        - tags: Comma-separated tags to filter by
    """
    try:
        query = request.args.get('q', '').strip()
        tags_string = request.args.get('tags', '').strip()
        
        # Process tags
        tags = [tag.strip() for tag in tags_string.split(',') if tag.strip()] if tags_string else None
        
        resources = supabase_client.search_resources(
            query=query if query else None,
            tags=tags
        )
        
        return jsonify({'resources': resources}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-request', methods=['POST'])
def create_request():
    """
    Create a resource request
    
    JSON body:
        - topic: Topic/resource being requested
        - created_by: Student name
    """
    try:
        data = request.get_json()
        
        topic = data.get('topic', '').strip()
        created_by = data.get('created_by', 'Anonymous').strip()
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        request_data = {
            'topic': topic,
            'votes': 0,
            'created_by': created_by,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = supabase_client.insert_request(request_data)
        
        return jsonify({
            'message': 'Request created successfully',
            'request': result[0] if result else request_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vote-request', methods=['POST'])
def vote_request():
    """
    Vote for a resource request
    
    JSON body:
        - request_id: UUID of the request
    """
    try:
        data = request.get_json()
        request_id = data.get('request_id')
        
        if not request_id:
            return jsonify({'error': 'Request ID is required'}), 400
        
        result = supabase_client.vote_request(request_id)
        
        return jsonify({
            'message': 'Vote recorded successfully',
            'request': result[0] if result else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/requests', methods=['GET'])
def get_requests():
    """Get all requests sorted by votes (highest first)"""
    try:
        requests = supabase_client.get_requests()
        return jsonify({'requests': requests}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Route not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)