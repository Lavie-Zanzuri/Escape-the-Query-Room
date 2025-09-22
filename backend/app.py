from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-for-development'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sql_quest.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    total_score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'total_score': self.total_score
        }

class GameProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime)

# API Routes
@app.route('/api/test', methods=['GET'])
def test_connection():
    """Test endpoint to verify backend is running"""
    return jsonify({
        'message': 'SQL Quest Backend is running perfectly! 🚀',
        'status': 'success',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/execute-sql', methods=['POST'])
def execute_sql():
    """Execute SQL queries safely (SELECT only)"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'No query provided'
            }), 400
        
        # Security: Only allow SELECT statements
        if not query.upper().startswith('SELECT'):
            return jsonify({
                'success': False,
                'error': 'Only SELECT queries are allowed for security reasons'
            }), 400
        
        # Connect to sample database
        sample_db_path = 'database/sample.db'
        if not os.path.exists(sample_db_path):
            return jsonify({
                'success': False,
                'error': 'Sample database not found. Please restart the server.'
            }), 500
            
        conn = sqlite3.connect(sample_db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        cursor = conn.cursor()
        
        # Execute query with timeout (5 seconds)
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Convert results to list of dictionaries
        if results:
            columns = [description[0] for description in cursor.description]
            data_results = []
            for row in results:
                data_results.append(dict(zip(columns, row)))
        else:
            columns = []
            data_results = []
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': data_results,
            'columns': columns,
            'row_count': len(data_results),
            'message': f'Query executed successfully! Found {len(data_results)} rows.'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Query error: {str(e)}'
        }), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({'success': False, 'error': 'Username is required'}), 400
        
        # Check if user exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({
                'success': True,
                'user': existing_user.to_dict(),
                'message': 'User already exists'
            })
        
        # Create new user
        user = User(username=username)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'User created successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Database error: {str(e)}'
        }), 500

def create_sample_database():
    """Create sample database with student data"""
    sample_db_path = 'database/sample.db'
    
    # Create database directory if it doesn't exist
    if not os.path.exists('database'):
        os.makedirs('database')
        print("📁 Created database directory")
    
    # Only create if doesn't exist
    if not os.path.exists(sample_db_path):
        conn = sqlite3.connect(sample_db_path)
        cursor = conn.cursor()
        
        # Create students table
        cursor.execute('''
            CREATE TABLE students (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                major TEXT NOT NULL,
                gpa REAL,
                enrollment_date DATE
            )
        ''')
        
        # Insert sample data - make it more interesting!
        sample_students = [
            (1, 'Alice Johnson', 'Computer Science', 3.8, '2022-09-01'),
            (2, 'Bob Smith', 'Mathematics', 3.5, '2022-09-01'),
            (3, 'Carol Davis', 'Computer Science', 3.9, '2021-09-01'),
            (4, 'David Wilson', 'Physics', 3.2, '2023-01-15'),
            (5, 'Eve Brown', 'Computer Science', 3.7, '2022-01-15'),
            (6, 'Frank Miller', 'Engineering', 3.4, '2022-09-01'),
            (7, 'Grace Lee', 'Computer Science', 4.0, '2021-09-01'),
            (8, 'Henry Taylor', 'Mathematics', 3.1, '2023-01-15'),
            (9, 'Ivy Chen', 'Computer Science', 3.6, '2022-09-01'),
            (10, 'Jack Robinson', 'Physics', 3.3, '2023-01-15')
        ]
        
        cursor.executemany(
            'INSERT INTO students (id, name, major, gpa, enrollment_date) VALUES (?, ?, ?, ?, ?)', 
            sample_students
        )
        
        # Create courses table for more interesting queries
        cursor.execute('''
            CREATE TABLE courses (
                course_id INTEGER PRIMARY KEY,
                course_name TEXT NOT NULL,
                instructor TEXT NOT NULL,
                credits INTEGER,
                semester TEXT
            )
        ''')
        
        sample_courses = [
            (1, 'Introduction to Programming', 'Dr. Smith', 4, 'Fall 2023'),
            (2, 'Data Structures', 'Prof. Johnson', 4, 'Spring 2024'),
            (3, 'Database Systems', 'Dr. Brown', 3, 'Fall 2023'),
            (4, 'Web Development', 'Prof. Davis', 3, 'Spring 2024'),
            (5, 'Machine Learning', 'Dr. Wilson', 4, 'Fall 2023')
        ]
        
        cursor.executemany(
            'INSERT INTO courses (course_id, course_name, instructor, credits, semester) VALUES (?, ?, ?, ?, ?)',
            sample_courses
        )
        
        # Create enrollments table for JOIN queries
        cursor.execute('''
            CREATE TABLE enrollments (
                enrollment_id INTEGER PRIMARY KEY,
                student_id INTEGER,
                course_id INTEGER,
                grade TEXT,
                FOREIGN KEY (student_id) REFERENCES students (id),
                FOREIGN KEY (course_id) REFERENCES courses (course_id)
            )
        ''')
        
        sample_enrollments = [
            (1, 1, 1, 'A'),
            (2, 1, 3, 'B+'),
            (3, 2, 1, 'B'),
            (4, 3, 2, 'A'),
            (5, 3, 3, 'A'),
            (6, 4, 1, 'C+'),
            (7, 5, 4, 'A-'),
            (8, 7, 5, 'A')
        ]
        
        cursor.executemany(
            'INSERT INTO enrollments (enrollment_id, student_id, course_id, grade) VALUES (?, ?, ?, ?)',
            sample_enrollments
        )
        
        conn.commit()
        conn.close()
        print("✅ Sample database created with students, courses, and enrollments!")
        print("📊 Available tables: students, courses, enrollments")
        return True
    else:
        print("📊 Sample database already exists")
        return False

def initialize_app():
    """Initialize database and sample data"""
    with app.app_context():
        # Create main database tables
        db.create_all()
        print("✅ Main database tables created!")
        
        # Create sample database
        create_sample_database()

if __name__ == '__main__':
    print("🚀 Starting SQL Quest Backend...")
    print("=" * 50)
    initialize_app()
    print("=" * 50)
    print("🌐 Server running on http://localhost:5000")
    print("🎯 Frontend should connect from http://localhost:3000")
    print("📊 Test endpoint: http://localhost:5000/api/test")
    print("🔥 Ready to receive SQL queries!")
    print("=" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')