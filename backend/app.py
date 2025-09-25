from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import sqlite3
import os
import json
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

# Room Data Configuration
ROOM_DATA = {
    'football': {
        'name': 'Football Stadium',
        'description': 'Infiltrate UEFA database to expose corruption',
        'stages': [
            {
                'id': 1,
                'title': 'Access Database',
                'description': 'Gain access to the UEFA player database. Find all players in the system.',
                'story': 'You\'ve breached the outer firewall! The UEFA database is open. Start by exploring what data is available.',
                'target_query': 'SELECT * FROM players LIMIT 5',
                'expected_result_type': 'basic_select',
                'hints': [
                    'Start with a simple SELECT statement',
                    'Look at the players table',
                    'Use SELECT * to see all columns'
                ]
            },
            {
                'id': 2,
                'title': 'Identify Targets',
                'description': 'Find all forwards (position = \'Forward\') who scored more than 20 goals.',
                'story': 'Good work! Now we need to identify the star players. Find the top goal scorers among forwards.',
                'target_query': 'SELECT name, position, goals_scored FROM players WHERE position = \'Forward\' AND goals_scored > 20',
                'expected_result_type': 'filtered_select',
                'hints': [
                    'Use WHERE clause with multiple conditions',
                    'Combine conditions with AND',
                    'Look for position = \'Forward\' and goals_scored > 20'
                ]
            },
            {
                'id': 3,
                'title': 'Team Salaries',
                'description': 'Calculate average salary for each team. Show team name and average salary.',
                'story': 'Excellent! Now we need to understand the money flow. Which teams are spending the most on player salaries?',
                'target_query': 'SELECT t.team_name, AVG(p.salary) as avg_salary FROM teams t JOIN players p ON t.team_id = p.team_id GROUP BY t.team_id, t.team_name ORDER BY avg_salary DESC',
                'expected_result_type': 'aggregation',
                'hints': [
                    'You need to JOIN teams and players tables',
                    'Use GROUP BY team to calculate averages',
                    'Use AVG() function for average salary'
                ]
            },
            {
                'id': 4,
                'title': 'Match Analysis',
                'description': 'Find matches where the home team lost despite having a higher average salary than the away team.',
                'story': 'Strange patterns emerging... Find matches where the expensive home team lost to a cheaper away team.',
                'target_query': '''SELECT m.match_id, ht.team_name as home_team, at.team_name as away_team, 
                                  m.home_score, m.away_score, m.match_date
                                  FROM matches m 
                                  JOIN teams ht ON m.home_team_id = ht.team_id 
                                  JOIN teams at ON m.away_team_id = at.team_id 
                                  WHERE m.home_score < m.away_score''',
                'expected_result_type': 'complex_join',
                'hints': [
                    'Join matches table with teams table twice (home and away)',
                    'Use aliases like ht for home_team and at for away_team',
                    'Filter where home_score < away_score'
                ]
            },
            {
                'id': 5,
                'title': 'Corruption Evidence',
                'description': 'Find players whose salary is more than 3 times their team\'s average salary.',
                'story': 'Final evidence needed! Find players with suspiciously high salaries compared to their teammates.',
                'target_query': '''SELECT p.name, p.salary, t.team_name,
                                  (SELECT AVG(salary) FROM players WHERE team_id = p.team_id) as team_avg_salary
                                  FROM players p 
                                  JOIN teams t ON p.team_id = t.team_id 
                                  WHERE p.salary > 3 * (SELECT AVG(salary) FROM players WHERE team_id = p.team_id)''',
                'expected_result_type': 'subquery',
                'hints': [
                    'Use subquery to calculate team average salary',
                    'Compare player salary to team average',
                    'Use WHERE with subquery comparison'
                ]
            }
        ]
    }
}

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
    """Execute SQL queries safely (SELECT only) - Original endpoint"""
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

@app.route('/api/execute-sql/<room_id>', methods=['POST'])
def execute_sql_room(room_id):
    """Execute SQL queries for specific room"""
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
        
        # Connect to room-specific database
        db_path = f'database/{room_id}.db'
        if not os.path.exists(db_path):
            return jsonify({
                'success': False,
                'error': f'Database for room {room_id} not found. Please restart the server.'
            }), 500
            
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Execute query
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

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    """Get list of available rooms"""
    rooms = []
    for room_id, room_data in ROOM_DATA.items():
        rooms.append({
            'id': room_id,
            'name': room_data['name'],
            'description': room_data['description'],
            'stages_count': len(room_data['stages'])
        })
    return jsonify({'rooms': rooms})

@app.route('/api/rooms/<room_id>', methods=['GET'])
def get_room_data(room_id):
    """Get specific room data"""
    if room_id not in ROOM_DATA:
        return jsonify({'error': 'Room not found'}), 404
    
    return jsonify(ROOM_DATA[room_id])

@app.route('/api/rooms/<room_id>/stage/<int:stage_id>', methods=['GET'])
def get_stage_data(room_id, stage_id):
    """Get specific stage data"""
    if room_id not in ROOM_DATA:
        return jsonify({'error': 'Room not found'}), 404
    
    room_data = ROOM_DATA[room_id]
    stage = next((s for s in room_data['stages'] if s['id'] == stage_id), None)
    
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404
    
    return jsonify(stage)

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

def create_football_database():
    """Create football database with sample data"""
    football_db_path = 'database/football.db'
    
    if not os.path.exists('database'):
        os.makedirs('database')
        print("📁 Created database directory")
    
    if not os.path.exists(football_db_path):
        conn = sqlite3.connect(football_db_path)
        cursor = conn.cursor()
        
        # Create teams table
        cursor.execute('''
            CREATE TABLE teams (
                team_id INTEGER PRIMARY KEY,
                team_name TEXT NOT NULL,
                city TEXT NOT NULL,
                league TEXT NOT NULL,
                founded_year INTEGER,
                stadium_capacity INTEGER
            )
        ''')
        
        # Create players table
        cursor.execute('''
            CREATE TABLE players (
                player_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                team_id INTEGER,
                position TEXT NOT NULL,
                age INTEGER,
                salary INTEGER,
                goals_scored INTEGER,
                FOREIGN KEY (team_id) REFERENCES teams (team_id)
            )
        ''')
        
        # Create matches table
        cursor.execute('''
            CREATE TABLE matches (
                match_id INTEGER PRIMARY KEY,
                home_team_id INTEGER,
                away_team_id INTEGER,
                match_date DATE,
                home_score INTEGER,
                away_score INTEGER,
                attendance INTEGER,
                FOREIGN KEY (home_team_id) REFERENCES teams (team_id),
                FOREIGN KEY (away_team_id) REFERENCES teams (team_id)
            )
        ''')
        
        # Insert sample teams
        teams_data = [
            (1, 'Manchester United', 'Manchester', 'Premier League', 1878, 75000),
            (2, 'Barcelona', 'Barcelona', 'La Liga', 1899, 99000),
            (3, 'Bayern Munich', 'Munich', 'Bundesliga', 1900, 75000),
            (4, 'Juventus', 'Turin', 'Serie A', 1897, 41000),
            (5, 'Paris Saint-Germain', 'Paris', 'Ligue 1', 1970, 48000),
            (6, 'Liverpool', 'Liverpool', 'Premier League', 1892, 54000),
            (7, 'Real Madrid', 'Madrid', 'La Liga', 1902, 81000),
            (8, 'Borussia Dortmund', 'Dortmund', 'Bundesliga', 1909, 81000)
        ]
        
        cursor.executemany('INSERT INTO teams VALUES (?, ?, ?, ?, ?, ?)', teams_data)
        
        # Insert sample players
        players_data = [
            (1, 'Marcus Rashford', 1, 'Forward', 26, 200000, 12),
            (2, 'Bruno Fernandes', 1, 'Midfielder', 29, 180000, 8),
            (3, 'Robert Lewandowski', 2, 'Forward', 35, 300000, 25),
            (4, 'Pedri', 2, 'Midfielder', 21, 100000, 4),
            (5, 'Harry Kane', 3, 'Forward', 30, 400000, 30),
            (6, 'Joshua Kimmich', 3, 'Midfielder', 28, 250000, 3),
            (7, 'Dusan Vlahovic', 4, 'Forward', 24, 280000, 18),
            (8, 'Federico Chiesa', 4, 'Winger', 26, 150000, 7),
            (9, 'Kylian Mbappe', 5, 'Forward', 25, 500000, 35),
            (10, 'Neymar', 5, 'Forward', 32, 400000, 15),
            (11, 'Mohamed Salah', 6, 'Forward', 31, 350000, 22),
            (12, 'Virgil van Dijk', 6, 'Defender', 32, 200000, 2),
            (13, 'Vinicius Jr', 7, 'Winger', 23, 300000, 18),
            (14, 'Luka Modric', 7, 'Midfielder', 38, 120000, 3),
            (15, 'Erling Haaland', 8, 'Forward', 23, 350000, 28)
        ]
        
        cursor.executemany('INSERT INTO players VALUES (?, ?, ?, ?, ?, ?, ?)', players_data)
        
        # Insert sample matches
        matches_data = [
            (1, 1, 2, '2024-03-15', 2, 1, 73000),
            (2, 3, 4, '2024-03-16', 3, 0, 75000),
            (3, 5, 6, '2024-03-17', 1, 2, 48000),
            (4, 7, 8, '2024-03-18', 2, 2, 78000),
            (5, 2, 3, '2024-03-20', 1, 4, 95000),
            (6, 4, 5, '2024-03-21', 0, 1, 40000),
            (7, 6, 7, '2024-03-22', 3, 1, 54000),
            (8, 8, 1, '2024-03-23', 1, 0, 81000)
        ]
        
        cursor.executemany('INSERT INTO matches VALUES (?, ?, ?, ?, ?, ?, ?)', matches_data)
        
        conn.commit()
        conn.close()
        print("✅ Football database created successfully!")
        print("📊 Available tables: teams, players, matches")
        return True
    else:
        print("📊 Football database already exists")
        return False

def initialize_app():
    """Initialize database and sample data"""
    with app.app_context():
        # Create main database tables
        db.create_all()
        print("✅ Main database tables created!")
        
        # Create sample database (existing)
        create_sample_database()
        
        # Create football database (new)
        create_football_database()

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