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
        'database_schema': {
            'teams': ['team_id', 'team_name', 'city', 'league', 'founded_year', 'stadium_capacity'],
            'players': ['player_id', 'name', 'team_id', 'position', 'age', 'salary', 'goals_scored'],
            'matches': ['match_id', 'home_team_id', 'away_team_id', 'match_date', 'home_score', 'away_score', 'attendance']
        },
        'stages': [
            {
                'id': 1,
                'title': 'Database Access',
                'description': 'Gain access to the UEFA player database. Find all players in the system.',
                'story': 'You\'ve breached the outer firewall! The UEFA database is open. Start by exploring what data is available.',
                'database_info': '''Available Tables:
📋 teams (team_id, team_name, city, league, founded_year, stadium_capacity)
⚽ players (player_id, name, team_id, position, age, salary, goals_scored)
🏆 matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, attendance)''',
                'target_query': 'SELECT * FROM players',
                'expected_columns': ['player_id', 'name', 'team_id', 'position', 'age', 'salary', 'goals_scored'],
                'hints': [
                    'Start with SELECT * to see all columns',
                    'Use FROM players to query the players table',
                    'The basic syntax is: SELECT * FROM table_name'
                ]
            },
            {
                'id': 2,
                'title': 'Identify Top Scorers',
                'description': 'Find all forwards who scored more than 20 goals.',
                'story': 'Good work! Now we need to identify the star players. Find the top goal scorers among forwards.',
                'database_info': '''Available Tables:
📋 teams (team_id, team_name, city, league, founded_year, stadium_capacity)
⚽ players (player_id, name, team_id, position, age, salary, goals_scored)
🏆 matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, attendance)''',
                'target_query': 'SELECT name, position, goals_scored FROM players WHERE position = \'Forward\' AND goals_scored > 20',
                'expected_columns': ['name', 'position', 'goals_scored'],
                'validation': {
                    'min_rows': 5,
                    'required_position': 'Forward',
                    'min_goals': 20
                },
                'hints': [
                    'Use WHERE clause to filter results',
                    'Combine multiple conditions with AND',
                    'Filter by position = \'Forward\' AND goals_scored > 20',
                    'Select specific columns: name, position, goals_scored'
                ]
            },
            {
                'id': 3,
                'title': 'Team Salary Analysis',
                'description': 'Calculate average salary for each team. Show team name and average salary.',
                'story': 'Excellent! Now we need to understand the money flow. Which teams are spending the most on player salaries?',
                'database_info': '''Available Tables:
📋 teams (team_id, team_name, city, league, founded_year, stadium_capacity)
⚽ players (player_id, name, team_id, position, age, salary, goals_scored)
🏆 matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, attendance)''',
                'target_query': 'SELECT t.team_name, AVG(p.salary) as avg_salary FROM teams t JOIN players p ON t.team_id = p.team_id GROUP BY t.team_id, t.team_name ORDER BY avg_salary DESC',
                'expected_columns': ['team_name', 'avg_salary'],
                'validation': {
                    'requires_join': True,
                    'requires_aggregate': 'AVG',
                    'requires_group_by': True
                },
                'hints': [
                    'You need to JOIN teams and players tables',
                    'Use ON clause to match team_id in both tables',
                    'Use GROUP BY team_name to group by team',
                    'Use AVG(salary) to calculate average salary',
                    'Use ORDER BY avg_salary DESC to see highest first'
                ]
            },
            {
                'id': 4,
                'title': 'Upset Matches',
                'description': 'Find matches where the home team lost (scored fewer goals than away team).',
                'story': 'Strange patterns emerging... Find matches where the home team lost to the away team.',
                'database_info': '''Available Tables:
📋 teams (team_id, team_name, city, league, founded_year, stadium_capacity)
⚽ players (player_id, name, team_id, position, age, salary, goals_scored)
🏆 matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, attendance)''',
                'target_query': 'SELECT m.match_id, ht.team_name as home_team, at.team_name as away_team, m.home_score, m.away_score, m.match_date FROM matches m JOIN teams ht ON m.home_team_id = ht.team_id JOIN teams at ON m.away_team_id = at.team_id WHERE m.home_score < m.away_score',
                'expected_columns': ['match_id', 'home_team', 'away_team', 'home_score', 'away_score', 'match_date'],
                'validation': {
                    'requires_multiple_joins': True,
                    'home_score_less_than_away': True
                },
                'hints': [
                    'Join matches table with teams table TWICE',
                    'Use aliases: ht for home_team, at for away_team',
                    'First join: ON m.home_team_id = ht.team_id',
                    'Second join: ON m.away_team_id = at.team_id',
                    'Filter WHERE m.home_score < m.away_score'
                ]
            },
            {
                'id': 5,
                'title': 'Salary Outliers',
                'description': 'Find players whose salary is more than 2x their team\'s average salary.',
                'story': 'Final evidence needed! Find players with suspiciously high salaries compared to their teammates.',
                'database_info': '''Available Tables:
📋 teams (team_id, team_name, city, league, founded_year, stadium_capacity)
⚽ players (player_id, name, team_id, position, age, salary, goals_scored)
🏆 matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, attendance)''',
                'target_query': 'SELECT p.name, p.salary, t.team_name, (SELECT AVG(salary) FROM players WHERE team_id = p.team_id) as team_avg_salary FROM players p JOIN teams t ON p.team_id = t.team_id WHERE p.salary > 2 * (SELECT AVG(salary) FROM players WHERE team_id = p.team_id)',
                'expected_columns': ['name', 'salary', 'team_name', 'team_avg_salary'],
                'validation': {
                    'requires_subquery': True,
                    'salary_comparison': True
                },
                'hints': [
                    'Use a subquery to calculate team average: (SELECT AVG(salary) FROM players WHERE team_id = p.team_id)',
                    'Compare player salary to this subquery',
                    'Use WHERE p.salary > 2 * (subquery)',
                    'Join with teams to get team_name',
                    'This finds outliers earning way more than teammates'
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
        'message': 'SQL Quest Backend is running perfectly!',
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
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(query)
        results = cursor.fetchall()
        
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
        
        if not query.upper().startswith('SELECT'):
            return jsonify({
                'success': False,
                'error': 'Only SELECT queries are allowed for security reasons'
            }), 400
        
        db_path = f'database/{room_id}.db'
        if not os.path.exists(db_path):
            return jsonify({
                'success': False,
                'error': f'Database for room {room_id} not found. Please restart the server.'
            }), 500
            
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(query)
        results = cursor.fetchall()
        
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
        
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({
                'success': True,
                'user': existing_user.to_dict(),
                'message': 'User already exists'
            })
        
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

# ========================================
# VALIDATION SYSTEM
# ========================================

def validate_football_stage(stage, results, row_count):
    """
    Validate if the query results match the expected output for each stage
    """
    
    # Stage 1: Get all players
    if stage == 1:
        if row_count < 10:
            return {
                'valid': False,
                'message': 'Not enough players found. Make sure to SELECT all players from the database.'
            }
        
        # Check if basic columns exist
        if results and len(results) > 0:
            required_columns = ['name', 'position', 'salary']
            first_row = results[0]
            missing_columns = [col for col in required_columns if col not in first_row]
            
            if missing_columns:
                return {
                    'valid': False,
                    'message': f'Your query is missing important columns. Try using SELECT * to get all columns.'
                }
        
        return {
            'valid': True,
            'message': 'Perfect! You accessed all players in the database.'
        }
    
    # Stage 2: Forwards with more than 20 goals
    elif stage == 2:
        if row_count == 0:
            return {
                'valid': False,
                'message': 'No results found. Remember to filter for Forwards with more than 20 goals.'
            }
        
        # Validate each row has correct position and goals
        for row in results:
            position = row.get('position', '')
            goals = row.get('goals_scored', 0)
            
            if position != 'Forward':
                return {
                    'valid': False,
                    'message': 'Your results include players who are not Forwards. Filter by position = \'Forward\'.'
                }
            
            if goals <= 20:
                return {
                    'valid': False,
                    'message': f'Some players have 20 goals or less. You need players with MORE than 20 goals (goals_scored > 20).'
                }
        
        if row_count < 3:
            return {
                'valid': False,
                'message': 'You found some players, but there should be more forwards with over 20 goals. Check your query again.'
            }
        
        return {
            'valid': True,
            'message': 'Excellent! You found all the top-scoring forwards.'
        }
    
    # Stage 3: Average salary by team (requires JOIN and GROUP BY)
    elif stage == 3:
        if row_count == 0:
            return {
                'valid': False,
                'message': 'No results found. You need to JOIN teams and players tables, then GROUP BY team.'
            }
        
        # Check if we have team names (means JOIN worked)
        if results and len(results) > 0:
            first_row = results[0]
            
            # Check for team_name column (from JOIN)
            if 'team_name' not in first_row:
                return {
                    'valid': False,
                    'message': 'Missing team names. You need to JOIN the teams table to get team_name.'
                }
            
            # Check for average salary calculation
            avg_col = None
            for key in first_row.keys():
                if 'avg' in key.lower() or 'salary' in key.lower():
                    avg_col = key
                    break
            
            if not avg_col:
                return {
                    'valid': False,
                    'message': 'Missing average salary calculation. Use AVG(salary) in your SELECT.'
                }
            
            # Check if we have multiple teams (GROUP BY worked)
            if row_count < 5:
                return {
                    'valid': False,
                    'message': 'Not enough teams found. Make sure you\'re using GROUP BY to group by each team.'
                }
        
        return {
            'valid': True,
            'message': 'Perfect! You calculated average salaries for each team.'
        }
    
    # Stage 4: Matches where home team lost
    elif stage == 4:
        if row_count == 0:
            return {
                'valid': False,
                'message': 'No matches found. Look for matches where home_score < away_score.'
            }
        
        # Validate that home team actually lost in each match
        for row in results:
            home_score = row.get('home_score', 0)
            away_score = row.get('away_score', 0)
            
            if home_score >= away_score:
                return {
                    'valid': False,
                    'message': 'Some matches don\'t show home team losses. Filter where home_score < away_score.'
                }
            
            # Check if we have team names (means JOIN worked)
            if 'home_team' not in row and 'team_name' not in row:
                return {
                    'valid': False,
                    'message': 'Missing team names. You need to JOIN with the teams table twice to get both home and away team names.'
                }
        
        return {
            'valid': True,
            'message': 'Great! You found all matches where the home team lost.'
        }
    
    # Stage 5: Players with salary > 2x team average (requires subquery)
    elif stage == 5:
        if row_count == 0:
            return {
                'valid': False,
                'message': 'No salary outliers found. Look for players whose salary is more than 2x their team\'s average.'
            }
        
        # Check if results include necessary data
        if results and len(results) > 0:
            first_row = results[0]
            
            if 'salary' not in first_row:
                return {
                    'valid': False,
                    'message': 'Missing salary information. Make sure to include player salary in your SELECT.'
                }
            
            # Ideally check if salary is actually > 2x average
            # This is a simplified check - in production you'd verify the actual calculation
            if row_count < 2:
                return {
                    'valid': False,
                    'message': 'There should be more players with unusually high salaries. Use a subquery to calculate the team average and compare.'
                }
        
        return {
            'valid': True,
            'message': 'Outstanding! You found all the salary outliers using a subquery.'
        }
    
    # Unknown stage
    return {
        'valid': False,
        'message': 'Unknown stage number.'
    }


@app.route('/api/validate-query/<room_id>/<int:stage>', methods=['POST'])
def validate_query(room_id, stage):
    """
    Validate query results against expected output for the stage
    """
    try:
        data = request.json
        results = data.get('results', [])
        row_count = data.get('row_count', len(results))
        
        if room_id == 'football':
            validation = validate_football_stage(stage, results, row_count)
            return jsonify(validation)
        
        return jsonify({
            'valid': False,
            'message': f'Validation not implemented for room: {room_id}'
        })
        
    except Exception as e:
        return jsonify({
            'valid': False,
            'message': f'Validation error: {str(e)}'
        }), 500


def create_sample_database():
    """Create sample database with student data"""
    sample_db_path = 'database/sample.db'
    
    if not os.path.exists('database'):
        os.makedirs('database')
        print("✅ Created database directory")
    
    if not os.path.exists(sample_db_path):
        conn = sqlite3.connect(sample_db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE students (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                major TEXT NOT NULL,
                gpa REAL,
                enrollment_date DATE
            )
        ''')
        
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
        print("✅ Sample database created successfully!")
        return True
    else:
        print("📊 Sample database already exists")
        return False

def create_football_database():
    """Create football database with sample data"""
    football_db_path = 'database/football.db'
    
    if not os.path.exists('database'):
        os.makedirs('database')
    
    if not os.path.exists(football_db_path):
        conn = sqlite3.connect(football_db_path)
        cursor = conn.cursor()
        
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
        return True
    else:
        print("📊 Football database already exists")
        return False

def initialize_app():
    """Initialize database and sample data"""
    with app.app_context():
        db.create_all()
        print("✅ Main database tables created!")
        create_sample_database()
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