### Resource Bridge

Resource Bridge is a web application that connects teachers and students through a centralized platform.

Teachers can upload educational resources (PDFs), and students can:
- Search and filter resources
- Request new topics
- Vote on requested resources

The goal is to improve accessibility and collaboration in learning.

Features

-  User Authentication (via Supabase)
-  Teacher Dashboard (Upload resources)
-  Student Dashboard (View & search resources)
-  Smart Search & Tag Filtering
-  Resource Request System
-  Voting System for requests
- Cloud Storage for PDFs

 Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Flask (Python)

### Database & Services
- Supabase (PostgreSQL)
- Supabase Storage
- Supabase Authentication




##  Application Flow

1. User logs in using Supabase Authentication
2. Based on email:
   - Teacher → Teacher Dashboard
   - Student → Student Dashboard
3. Teacher uploads resource:
   - File stored in Supabase Storage
   - Metadata stored in PostgreSQL
4. Student:
   - Fetches resources via Flask API
   - Searches and filters data
   - Requests new resources
   - Votes on requests






## Setup Instructions

### 1. Clone the repository

git clone https://github.com/your-username/resource-bridge.git
cd resource-bridge

### 2. Create virtual environment

python -m venv venv
source venv/bin/activate   (Mac/Linux)
venv\Scripts\activate      (Windows)

### 3. Install dependencies

pip install -r requirements.txt

### 4. Configure environment variables

Add your Supabase credentials in config.py:
- SUPABASE_URL
- SUPABASE_KEY

### 5. Run the app

python app.py

### 6. Open in browser

http://localhost:5001





##  Database Schema

### resources table
- id
- title
- description
- tags
- file_url
- uploaded_by
- created_at

### requests table
- id
- topic
- votes
- created_by
- created_at





