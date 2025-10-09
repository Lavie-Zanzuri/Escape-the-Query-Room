from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime

# AI Hints Support
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables and configure Gemini AI
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini AI configured successfully!")
else:
    print("⚠️ Warning: GEMINI_API_KEY not found in .env file")
    print("⚠️ AI hints will not be available")

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
    },
    'space': {
        'name': 'Orbital Space Station',
        'description': 'Stabilise the ISS Helios after a cascade of system failures',
        'database_schema': {
            'modules': ['module_id', 'module_name', 'function', 'oxygen_level', 'power_usage', 'status', 'pressure_kpa', 'last_inspection'],
            'crew_members': ['crew_id', 'name', 'rank', 'specialization', 'assigned_module_id', 'shift', 'clearance_level', 'on_duty'],
            'system_alerts': ['alert_id', 'module_id', 'alert_type', 'severity', 'detected_at', 'status', 'resolved_at'],
            'sensor_readings': ['reading_id', 'module_id', 'sensor_type', 'value', 'status', 'recorded_at'],
            'maintenance_logs': ['log_id', 'module_id', 'task', 'performed_by', 'task_date', 'next_due_date', 'risk_level']
        },
        'stages': [
            {
                'id': 1,
                'title': 'Telemetry Uplink',
                'description': 'Show every module with its name, function, status, and oxygen level.',
                'story': 'Mission control needs a quick snapshot of all station modules before we decide the next move.',
                'database_info': '''Available Tables:
🛰️ modules (module_id, module_name, function, oxygen_level, power_usage, status, pressure_kpa, last_inspection)
👩‍🚀 crew_members (crew_id, name, rank, specialization, assigned_module_id, shift, clearance_level, on_duty)
🚨 system_alerts (alert_id, module_id, alert_type, severity, detected_at, status, resolved_at)
📡 sensor_readings (reading_id, module_id, sensor_type, value, status, recorded_at)
🛠️ maintenance_logs (log_id, module_id, task, performed_by, task_date, next_due_date, risk_level)''',
                'target_query': 'SELECT module_id, module_name, function, status, oxygen_level FROM modules ORDER BY module_id',
                'expected_columns': ['module_id', 'module_name', 'function', 'status', 'oxygen_level'],
                'hints': [
                    'Use SELECT to specify the columns you need from modules.',
                    'Include status and oxygen_level so mission control can see critical readings.',
                    'Order by module_id to match the telemetry panel layout.'
                ]
            },
            {
                'id': 2,
                'title': 'Oxygen Anomalies',
                'description': 'List the modules where oxygen_level is under 75, lowest value first.',
                'story': 'Any module under 75% oxygen is unsafe—highlight the worst readings so the life-support team can respond.',
                'database_info': '''Remember:
🛰️ modules holds environmental stats for every compartment.
Look for oxygen_level values below the safe 75% threshold.''',
                'target_query': 'SELECT module_name, oxygen_level FROM modules WHERE oxygen_level < 75 ORDER BY oxygen_level ASC',
                'expected_columns': ['module_name', 'oxygen_level'],
                'validation': {
                    'max_safe_level': 75,
                    'expected_count': 3
                },
                'hints': [
                    'Filter the modules table using a WHERE clause on oxygen_level.',
                    'Compare oxygen_level against the 75 threshold.',
                    'Sort ascending so the worst readings appear first.'
                ]
            },
            {
                'id': 3,
                'title': 'Crew Deployment',
                'description': 'Find on-duty crew members (clearance >= 4) who are assigned to critical modules.',
                'story': 'We only have a couple of specialists inside the danger zones—verify exactly who is already in place.',
                'database_info': '''Need-to-know:
🧑‍🚀 crew_members links each astronaut to a module via assigned_module_id.
Only on_duty crew with clearance_level >= 4 can respond immediately.
Find them in modules flagged as Critical.''',
                'target_query': 'SELECT c.name, c.rank, m.module_name FROM crew_members c JOIN modules m ON c.assigned_module_id = m.module_id WHERE m.status = "Critical" AND c.clearance_level >= 4 AND c.on_duty = 1 ORDER BY c.name',
                'expected_columns': ['name', 'rank', 'module_name'],
                'validation': {
                    'required_clearance': 4,
                    'require_on_duty': True,
                    'module_status': 'Critical',
                    'expected_names': ['Engineer Sora Kim', 'Specialist Amina Chen']
                },
                'hints': [
                    'You must join crew_members to modules using the assigned_module_id.',
                    'Filter to modules where status is Critical.',
                    'Remember to require clearance at least 4 and on-duty crew only.'
                ]
            },
            {
                'id': 4,
                'title': 'Critical Alerts Board',
                'description': 'Show active critical alerts with module names and the time they were detected.',
                'story': 'Command wants the current alarm list in one table—module, alert, and timestamp.',
                'database_info': '''Tip:
🚨 system_alerts stores each alarm. Look for severity = "Critical" and status = "Active".
Join to modules to translate module_id into a human-readable name.''',
                'target_query': 'SELECT a.alert_id, m.module_name, a.alert_type, a.detected_at FROM system_alerts a JOIN modules m ON a.module_id = m.module_id WHERE a.status = "Active" AND a.severity = "Critical" ORDER BY a.detected_at',
                'expected_columns': ['alert_id', 'module_name', 'alert_type', 'detected_at'],
                'validation': {
                    'expected_count': 2,
                    'required_status': 'Active',
                    'required_severity': 'Critical'
                },
                'hints': [
                    'Join system_alerts with modules so you can show which area is affected.',
                    'Filter by both status and severity to isolate critical emergencies.',
                    'Order by detected_at to see the timeline of failures.'
                ]
            },
            {
                'id': 5,
                'title': 'Evacuation Priority',
                'description': 'Report the critical module with a warning pressure sensor and a high-risk maintenance task.',
                'story': 'Combine the pressure readings and maintenance backlog to flag which compartment must evacuate first.',
                'database_info': '''Final intel:
📡 sensor_readings tracks live metrics like pressure.
🛠️ maintenance_logs shows outstanding work and risk levels.
Focus on modules where status is Critical, pressure sensors report Warning, and risk_level is High.''',
                'target_query': 'SELECT m.module_name, s.value AS pressure_kpa, l.task, l.next_due_date FROM modules m JOIN sensor_readings s ON m.module_id = s.module_id JOIN maintenance_logs l ON m.module_id = l.module_id WHERE m.status = "Critical" AND s.sensor_type = "Pressure" AND s.status = "Warning" AND l.risk_level = "High" ORDER BY s.value ASC',
                'expected_columns': ['module_name', 'pressure_kpa', 'task', 'next_due_date'],
                'validation': {
                    'expected_count': 1,
                    'sensor_type': 'Pressure',
                    'sensor_status': 'Warning',
                    'module_status': 'Critical',
                    'risk_level': 'High'
                },
                'hints': [
                    'You will need multiple JOINs across modules, sensor_readings, and maintenance_logs.',
                    'Filter sensor_readings to only the pressure sensor in a warning state.',
                    'Limit to critical modules and HIGH risk maintenance tasks to find the evacuation priority.'
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
            'message': f'Query executed successfully! Found {len(data_results)} rows.',
            'query': query
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


def validate_space_stage(stage, results, row_count):
    """Validation rules for the Orbital Space Station room."""

    if stage == 1:
        if row_count < 6:
            return {
                'valid': False,
                'message': 'Mission control expected telemetry for every module. Make sure you are selecting all modules.'
            }

        if results:
            first_row = results[0]
            required = {'module_id', 'module_name', 'function', 'status', 'oxygen_level'}
            if not required.issubset(first_row.keys()):
                return {
                    'valid': False,
                    'message': 'Your report is missing critical module fields. Double-check the columns you SELECT.'
                }

        return {
            'valid': True,
            'message': 'Telemetry uplink stable. All modules reported in from the Helios station.'
        }

    if stage == 2:
        expected_count = 3
        if row_count != expected_count:
            return {
                'valid': False,
                'message': 'There should be exactly three modules under the oxygen threshold. Verify your WHERE filter and ordering.'
            }

        for row in results:
            oxygen = row.get('oxygen_level')
            if oxygen is None or float(oxygen) >= 75:
                return {
                    'valid': False,
                    'message': 'One of the returned modules is not below 75% oxygen. Tighten the oxygen_level condition.'
                }

        return {
            'valid': True,
            'message': 'Oxygen anomalies identified. Life-support teams are moving to seal those modules.'
        }

    if stage == 3:
        expected_names = {'Engineer Sora Kim', 'Specialist Amina Chen'}
        names_returned = {row.get('name') for row in results}

        if names_returned != expected_names:
            return {
                'valid': False,
                'message': 'You need the on-duty specialists inside the critical modules. Cross-check the module status, clearance, and duty rosters.'
            }

        return {
            'valid': True,
            'message': 'Crew deployment confirmed. High-clearance specialists are ready inside the critical zones.'
        }

    if stage == 4:
        expected_alerts = {'Helios Reactor', 'Luna Greenhouse'}
        if row_count != len(expected_alerts):
            return {
                'valid': False,
                'message': 'Mission control still sees two active critical alarms. Make sure you are filtering by severity and status.'
            }

        modules = {row.get('module_name') for row in results}
        if modules != expected_alerts:
            return {
                'valid': False,
                'message': 'One of the alerts you reported is not critical or not active. Re-run the diagnostics filter.'
            }

        return {
            'valid': True,
            'message': 'Critical alerts board synced. Command has eyes on every unresolved emergency.'
        }

    if stage == 5:
        if row_count != 1:
            return {
                'valid': False,
                'message': 'Only one module meets the pressure warning and high-risk maintenance criteria. Revisit your JOIN logic and filters.'
            }

        row = results[0]
        if row.get('module_name') != 'Helios Reactor':
            return {
                'valid': False,
                'message': 'The Helios Reactor is the evacuation priority. Review the maintenance risk levels and pressure sensor status.'
            }

        return {
            'valid': True,
            'message': 'Evacuation priority locked. Helios Reactor teams are withdrawing to the safe corridor.'
        }

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
        if room_id == 'space':
            validation = validate_space_stage(stage, results, row_count)
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

def create_casino_database():
    """Create casino database with all tables and sample data"""
    db_path = 'database/casino.db'
    
    if not os.path.exists('database'):
        os.makedirs('database')
    
    if os.path.exists(db_path):
        print("🎰 Casino database already exists")
        return False
    
    print("🎰 Creating Casino Heist database...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
        CREATE TABLE slot_machines (
            machine_id INTEGER PRIMARY KEY,
            machine_name TEXT NOT NULL,
            location TEXT NOT NULL,
            payout_percentage REAL NOT NULL,
            installed_date TEXT NOT NULL,
            status TEXT NOT NULL
        )
        ''')
        
        machines_data = [
            (1, 'Lucky 777', 'Main Floor', 92.5, '2023-01-15', 'Active'),
            (2, 'Diamond Jackpot', 'Main Floor', 94.2, '2023-02-20', 'Active'),
            (3, 'Golden Spin', 'VIP Room', 95.8, '2023-03-10', 'Active'),
            (4, 'Cherry Blast', 'Main Floor', 91.3, '2023-01-25', 'Active'),
            (5, 'Royal Flush', 'VIP Room', 96.5, '2023-04-05', 'Active'),
            (6, 'Mega Fortune', 'Main Floor', 78.2, '2023-05-12', 'Active'),
            (7, 'Wild West', 'Side Hall', 93.1, '2023-02-14', 'Active'),
            (8, 'Pirate\'s Gold', 'Side Hall', 92.8, '2023-03-22', 'Active'),
            (9, 'Egyptian Treasure', 'Main Floor', 76.5, '2023-06-01', 'Active'),
            (10, 'Space Adventure', 'VIP Room', 94.7, '2023-04-18', 'Active'),
            (11, 'Lucky Clover', 'Main Floor', 75.8, '2023-06-15', 'Active'),
            (12, 'Dragon\'s Lair', 'VIP Room', 95.2, '2023-05-20', 'Active')
        ]
        cursor.executemany('INSERT INTO slot_machines VALUES (?,?,?,?,?,?)', machines_data)
        
        cursor.execute('''
        CREATE TABLE players (
            player_id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            vip_level TEXT NOT NULL,
            registration_date TEXT NOT NULL,
            total_deposited REAL NOT NULL,
            total_withdrawn REAL NOT NULL
        )
        ''')
        
        players_data = [
            (1, 'HighRoller99', 'highroller@email.com', 'Platinum', '2023-01-10', 150000.00, 82000.00),
            (2, 'LuckyStrike', 'lucky@email.com', 'Gold', '2023-02-15', 85000.00, 95000.00),
            (3, 'SlotMaster', 'slotmaster@email.com', 'Silver', '2023-03-20', 45000.00, 38000.00),
            (4, 'JackpotHunter', 'jackpot@email.com', 'Bronze', '2023-04-05', 25000.00, 18000.00),
            (5, 'CasinoKing', 'king@email.com', 'Platinum', '2023-01-25', 200000.00, 95000.00),
            (6, 'SpinQueen', 'queen@email.com', 'Gold', '2023-02-28', 65000.00, 48000.00),
            (7, 'BetBig', 'betbig@email.com', 'Silver', '2023-05-10', 35000.00, 22000.00),
            (8, 'WinnerCircle', 'winner@email.com', 'Bronze', '2023-06-01', 15000.00, 8500.00),
            (9, 'MegaPlayer', 'mega@email.com', 'Platinum', '2023-03-15', 180000.00, 75000.00),
            (10, 'FortuneFinder', 'fortune@email.com', 'Gold', '2023-04-20', 55000.00, 62000.00)
        ]
        cursor.executemany('INSERT INTO players VALUES (?,?,?,?,?,?,?)', players_data)
        
        cursor.execute('''
        CREATE TABLE games (
            game_id INTEGER PRIMARY KEY,
            player_id INTEGER NOT NULL,
            machine_id INTEGER NOT NULL,
            bet_amount REAL NOT NULL,
            payout_amount REAL NOT NULL,
            game_timestamp TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            FOREIGN KEY (player_id) REFERENCES players(player_id),
            FOREIGN KEY (machine_id) REFERENCES slot_machines(machine_id)
        )
        ''')
        
        games_data = [
            (1, 1, 1, 100.00, 50.00, '2024-01-15 14:30:00', 45),
            (2, 1, 2, 150.00, 200.00, '2024-01-15 15:45:00', 60),
            (3, 1, 3, 200.00, 180.00, '2024-01-15 16:20:00', 55),
            (4, 5, 6, 500.00, 50.00, '2024-01-16 10:15:00', 30),
            (5, 5, 6, 1000.00, 100.00, '2024-01-16 10:50:00', 35),
            (6, 5, 9, 800.00, 80.00, '2024-01-16 11:30:00', 28),
            (7, 5, 11, 1200.00, 120.00, '2024-01-16 12:00:00', 32),
            (8, 5, 6, 1500.00, 150.00, '2024-01-16 14:00:00', 40),
            (9, 9, 6, 600.00, 60.00, '2024-01-17 09:00:00', 25),
            (10, 9, 9, 700.00, 70.00, '2024-01-17 10:00:00', 30),
            (11, 9, 11, 900.00, 90.00, '2024-01-17 11:00:00', 35),
            (12, 2, 1, 80.00, 120.00, '2024-01-15 13:00:00', 50),
            (13, 2, 5, 300.00, 450.00, '2024-01-15 14:30:00', 70),
            (14, 3, 2, 60.00, 55.00, '2024-01-16 15:00:00', 40),
            (15, 3, 4, 75.00, 90.00, '2024-01-16 16:00:00', 45),
            (16, 4, 1, 50.00, 40.00, '2024-01-17 12:00:00', 35),
            (17, 4, 7, 100.00, 95.00, '2024-01-17 13:30:00', 48),
            (18, 5, 6, 2000.00, 200.00, '2024-01-18 02:30:00', 20),
            (19, 9, 9, 1800.00, 180.00, '2024-01-18 03:15:00', 22),
            (20, 5, 11, 2500.00, 250.00, '2024-01-18 03:45:00', 25),
            (21, 6, 3, 250.00, 280.00, '2024-01-18 10:00:00', 55),
            (22, 6, 5, 400.00, 500.00, '2024-01-18 11:30:00', 65),
            (23, 7, 2, 120.00, 110.00, '2024-01-18 14:00:00', 42),
            (24, 7, 8, 150.00, 140.00, '2024-01-18 15:30:00', 50),
            (25, 8, 1, 40.00, 45.00, '2024-01-18 16:00:00', 38),
            (26, 10, 5, 300.00, 380.00, '2024-01-18 17:00:00', 60)
        ]
        cursor.executemany('INSERT INTO games VALUES (?,?,?,?,?,?,?)', games_data)
        
        cursor.execute('''
        CREATE TABLE employees (
            employee_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            access_level TEXT NOT NULL,
            salary REAL NOT NULL,
            hire_date TEXT NOT NULL
        )
        ''')
        
        employees_data = [
            (1, 'John Martinez', 'Floor Manager', 'Level 3', 65000.00, '2020-03-15'),
            (2, 'Sarah Chen', 'Security Chief', 'Level 4', 85000.00, '2019-06-20'),
            (3, 'Mike Stevens', 'Slot Technician', 'Level 2', 45000.00, '2022-01-10'),
            (4, 'Emily Rodriguez', 'Pit Boss', 'Level 3', 70000.00, '2021-08-05'),
            (5, 'David Kim', 'IT Administrator', 'Level 5', 95000.00, '2023-02-14'),
            (6, 'Lisa Anderson', 'Cashier', 'Level 1', 35000.00, '2023-04-20'),
            (7, 'Robert Taylor', 'Slot Technician', 'Level 2', 48000.00, '2023-05-15'),
            (8, 'Jennifer White', 'VIP Host', 'Level 2', 55000.00, '2021-11-30'),
            (9, 'Carlos Mendez', 'Maintenance', 'Level 2', 42000.00, '2022-09-10'),
            (10, 'Amanda Brooks', 'Surveillance', 'Level 3', 62000.00, '2020-07-25')
        ]
        cursor.executemany('INSERT INTO employees VALUES (?,?,?,?,?,?)', employees_data)
        
        cursor.execute('''
        CREATE TABLE suspicious_events (
            event_id INTEGER PRIMARY KEY,
            machine_id INTEGER NOT NULL,
            employee_id INTEGER,
            event_type TEXT NOT NULL,
            event_timestamp TEXT NOT NULL,
            severity TEXT NOT NULL,
            FOREIGN KEY (machine_id) REFERENCES slot_machines(machine_id),
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        )
        ''')
        
        events_data = [
            (1, 6, 7, 'Maintenance Access', '2024-01-14 23:45:00', 'Medium'),
            (2, 6, 5, 'Software Update', '2024-01-15 01:30:00', 'High'),
            (3, 9, 7, 'Maintenance Access', '2024-01-15 23:30:00', 'Medium'),
            (4, 9, 5, 'Software Update', '2024-01-16 02:00:00', 'High'),
            (5, 11, 7, 'Maintenance Access', '2024-01-16 23:15:00', 'Medium'),
            (6, 11, 5, 'Software Update', '2024-01-17 01:45:00', 'High'),
            (7, 6, None, 'Payout Error', '2024-01-18 10:30:00', 'Low'),
            (8, 9, None, 'Connection Lost', '2024-01-18 14:00:00', 'Low'),
            (9, 11, None, 'Payout Error', '2024-01-18 16:30:00', 'Low'),
            (10, 6, 7, 'Hardware Check', '2024-01-18 22:00:00', 'Medium')
        ]
        cursor.executemany('INSERT INTO suspicious_events VALUES (?,?,?,?,?,?)', events_data)
        
        conn.commit()
        print("✅ Casino database created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating casino database: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def create_space_database():
    """Create orbital space station database with mission-critical telemetry."""
    db_path = 'database/space.db'

    if not os.path.exists('database'):
        os.makedirs('database')

    if os.path.exists(db_path):
        print("🛰️ Space station database already exists")
        return False

    print("🛰️ Creating Orbital Space Station database...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute('''
        CREATE TABLE modules (
            module_id INTEGER PRIMARY KEY,
            module_name TEXT NOT NULL,
            function TEXT NOT NULL,
            oxygen_level REAL NOT NULL,
            power_usage REAL NOT NULL,
            status TEXT NOT NULL,
            pressure_kpa REAL NOT NULL,
            last_inspection TEXT NOT NULL
        )
        ''')

        modules_data = [
            (1, 'Aurora Habitat', 'Crew Quarters', 78.5, 62.4, 'Stable', 101.3, '2024-07-13'),
            (2, 'Orion Lab', 'Research Laboratory', 71.2, 74.1, 'Alert', 96.4, '2024-07-11'),
            (3, 'Helios Reactor', 'Power Core', 65.8, 92.7, 'Critical', 84.7, '2024-07-02'),
            (4, 'Zephyr Dock', 'Docking Bay', 82.1, 55.6, 'Stable', 100.2, '2024-07-15'),
            (5, 'Aegis Control', 'Command Center', 88.9, 68.3, 'Alert', 102.4, '2024-07-12'),
            (6, 'Luna Greenhouse', 'Life Support', 69.5, 60.8, 'Critical', 88.9, '2024-07-08')
        ]
        cursor.executemany('INSERT INTO modules VALUES (?,?,?,?,?,?,?,?)', modules_data)

        cursor.execute('''
        CREATE TABLE crew_members (
            crew_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            rank TEXT NOT NULL,
            specialization TEXT NOT NULL,
            assigned_module_id INTEGER NOT NULL,
            shift TEXT NOT NULL,
            clearance_level INTEGER NOT NULL,
            on_duty INTEGER NOT NULL,
            FOREIGN KEY (assigned_module_id) REFERENCES modules(module_id)
        )
        ''')

        crew_members_data = [
            (1, 'Commander Elise Park', 'Commander', 'Mission Lead', 5, '00:00-08:00', 5, 1),
            (2, 'Dr. Malik Rao', 'Chief Scientist', 'Bio Research', 2, '08:00-16:00', 4, 1),
            (3, 'Engineer Sora Kim', 'Systems Engineer', 'Reactor Operations', 3, '16:00-00:00', 4, 1),
            (4, 'Lt. Ivan Petrov', 'Security Officer', 'Security', 5, '16:00-00:00', 3, 0),
            (5, 'Specialist Amina Chen', 'Life Support Specialist', 'Atmospheric Systems', 6, '16:00-00:00', 4, 1),
            (6, 'Navigator Luis Ortega', 'Navigator', 'Flight Control', 1, '08:00-16:00', 3, 0)
        ]
        cursor.executemany('INSERT INTO crew_members VALUES (?,?,?,?,?,?,?,?)', crew_members_data)

        cursor.execute('''
        CREATE TABLE system_alerts (
            alert_id INTEGER PRIMARY KEY,
            module_id INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            detected_at TEXT NOT NULL,
            status TEXT NOT NULL,
            resolved_at TEXT,
            FOREIGN KEY (module_id) REFERENCES modules(module_id)
        )
        ''')

        system_alerts_data = [
            (1, 3, 'Power Flux', 'Critical', '2024-08-01 14:05:00', 'Active', None),
            (2, 2, 'Containment Leak', 'High', '2024-08-01 13:40:00', 'Investigating', None),
            (3, 6, 'CO2 Spike', 'Critical', '2024-08-01 14:12:00', 'Active', None),
            (4, 4, 'Docking Alarm', 'Medium', '2024-08-01 11:50:00', 'Resolved', '2024-08-01 12:05:00'),
            (5, 5, 'Navigation Fault', 'High', '2024-08-01 13:10:00', 'Active', None)
        ]
        cursor.executemany('INSERT INTO system_alerts VALUES (?,?,?,?,?,?,?)', system_alerts_data)

        cursor.execute('''
        CREATE TABLE sensor_readings (
            reading_id INTEGER PRIMARY KEY,
            module_id INTEGER NOT NULL,
            sensor_type TEXT NOT NULL,
            value REAL NOT NULL,
            status TEXT NOT NULL,
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (module_id) REFERENCES modules(module_id)
        )
        ''')

        sensor_readings_data = [
            (1, 3, 'Pressure', 68.2, 'Warning', '2024-08-01 14:10:00'),
            (2, 3, 'Temperature', 94.7, 'Critical', '2024-08-01 14:11:30'),
            (3, 6, 'CO2', 850.0, 'Critical', '2024-08-01 14:09:45'),
            (4, 6, 'Pressure', 72.5, 'Warning', '2024-08-01 14:10:20'),
            (5, 2, 'Radiation', 0.92, 'Alert', '2024-08-01 13:50:00'),
            (6, 5, 'Gyro Drift', 4.5, 'Alert', '2024-08-01 13:55:00')
        ]
        cursor.executemany('INSERT INTO sensor_readings VALUES (?,?,?,?,?,?)', sensor_readings_data)

        cursor.execute('''
        CREATE TABLE maintenance_logs (
            log_id INTEGER PRIMARY KEY,
            module_id INTEGER NOT NULL,
            task TEXT NOT NULL,
            performed_by TEXT NOT NULL,
            task_date TEXT NOT NULL,
            next_due_date TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            FOREIGN KEY (module_id) REFERENCES modules(module_id)
        )
        ''')

        maintenance_logs_data = [
            (1, 3, 'Reinforce reactor coolant seals', 'Engineer Sora Kim', '2024-07-20', '2024-08-02', 'High'),
            (2, 6, 'Replace CO2 scrubber filters', 'Specialist Amina Chen', '2024-07-24', '2024-08-03', 'Medium'),
            (3, 2, 'Decontaminate lab iso-chambers', 'Dr. Malik Rao', '2024-07-15', '2024-08-05', 'High'),
            (4, 5, 'Calibrate navigation gyros', 'Navigator Luis Ortega', '2024-07-18', '2024-08-06', 'Medium'),
            (5, 1, 'Inspect habitat pressure seals', 'Commander Elise Park', '2024-07-10', '2024-08-07', 'Low')
        ]
        cursor.executemany('INSERT INTO maintenance_logs VALUES (?,?,?,?,?,?,?)', maintenance_logs_data)

        conn.commit()
        print("✅ Space station database created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating space database: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

@app.route('/api/rooms/casino', methods=['GET'])
def get_casino_room():
    """Get casino room information"""
    room_data = {
        "id": "casino",
        "name": "Casino Heist",
        "description": "Hack into the casino's rigged system and expose the fraud",
        "stages": [
            {"stage_id": 1, "title": "Stage 1: Rigged Machines"},
            {"stage_id": 2, "title": "Stage 2: Victim Analysis"},
            {"stage_id": 3, "title": "Stage 3: Night Shift"},
            {"stage_id": 4, "title": "Stage 4: Inside Job"},
            {"stage_id": 5, "title": "Stage 5: The Mastermind"}
        ]
    }
    return jsonify(room_data)

@app.route('/api/rooms/casino/stage/<int:stage_id>', methods=['GET'])
def get_casino_stage(stage_id):
    """Get specific casino stage data"""
    stages = {
        1: {
            "stage_id": 1,
            "title": "Rigged Machines",
            "story": "You've infiltrated the casino's database. Find machines with abnormally low payout rates.",
            "description": "Find all slot machines with a payout percentage below 80%.",
            "database_info": "slot_machines (machine_id, machine_name, location, payout_percentage, installed_date, status)",
            "hints": ["Use WHERE payout_percentage < 80"]
        },
        2: {
            "stage_id": 2,
            "title": "Victim Analysis",
            "story": "Find players who lost more than $50,000.",
            "description": "Find players where (total_deposited - total_withdrawn) > 50000.",
            "database_info": "players (player_id, username, email, vip_level, registration_date, total_deposited, total_withdrawn)",
            "hints": ["Calculate: total_deposited - total_withdrawn > 50000"]
        },
        3: {
            "stage_id": 3,
            "title": "Night Shift Mystery",
            "story": "Find games played between 2 AM and 4 AM.",
            "description": "Find all games where the hour is 02 or 03.",
            "database_info": "games (game_id, player_id, machine_id, bet_amount, payout_amount, game_timestamp, duration_seconds)",
            "hints": ["Use strftime('%H', game_timestamp) IN ('02', '03')"]
        },
        4: {
            "stage_id": 4,
            "title": "Inside Job",
            "story": "Connect employee_id 5 to rigged machines.",
            "description": "Find suspicious events by employee 5 on machines 6, 9, or 11 with High severity.",
            "database_info": "suspicious_events, employees",
            "hints": ["JOIN tables and filter by employee_id = 5"]
        },
        5: {
            "stage_id": 5,
            "title": "The Full Picture",
            "story": "Calculate total losses per player on rigged machines.",
            "description": "Show username, machine name, and SUM(bet_amount - payout_amount).",
            "database_info": "games, players, slot_machines",
            "hints": ["JOIN all three tables, filter machine_id IN (6,9,11), GROUP BY"]
        }
    }
    
    if stage_id not in stages:
        return jsonify({"error": "Stage not found"}), 404
    
    return jsonify(stages[stage_id])

@app.route('/api/execute-sql/casino', methods=['POST'])
def execute_casino_sql():
    """Execute SQL query on casino database"""
    data = request.json
    query = data.get('query', '').strip()
    
    if not query or not query.upper().startswith('SELECT'):
        return jsonify({"success": False, "error": "Only SELECT queries allowed"})
    
    try:
        conn = sqlite3.connect('database/casino.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        columns = [description[0] for description in cursor.description] if cursor.description else []
        data = [dict(row) for row in rows]
        
        conn.close()
        
        return jsonify({
            "success": True,
            "data": data,
            "columns": columns,
            "row_count": len(data),
            "query": query
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/validate-query/casino/<int:stage_id>', methods=['POST'])
def validate_casino_query(stage_id):
    """Validate casino query results"""
    data = request.json
    results = data.get('results', [])
    row_count = data.get('row_count', 0)
    
    validations = {
        1: {"expected_count": 3, "message": "Find machines with payout < 80%"},
        2: {"expected_count": 3, "message": "Find players who lost > $50,000"},
        3: {"expected_count": 3, "message": "Find games at 2-4 AM"},
        4: {"expected_count": 3, "message": "Find employee 5's high severity events"},
        5: {"expected_count": 6, "message": "Calculate losses on rigged machines"}
    }
    
    if stage_id not in validations:
        return jsonify({"valid": False, "message": "Invalid stage"})
    
    validation = validations[stage_id]
    
    if row_count != validation["expected_count"]:
        return jsonify({
            "valid": False,
            "message": f"Expected {validation['expected_count']} rows. {validation['message']}"
        })
    
    return jsonify({"valid": True, "message": "Correct!"})

# ==================== AI HINT SYSTEM ====================

@app.route('/api/ai-hint/<room_id>/<int:stage_id>', methods=['POST'])
def get_ai_hint(room_id, stage_id):
    """Generate AI hint for current stage using Gemini - provides unique strategic perspective"""
    if not GEMINI_API_KEY:
        return jsonify({
            'error': 'AI hints are temporarily unavailable. Try the regular hints!'
        }), 503
    
    try:
        data = request.json
        last_query = data.get('last_query', 'No query attempted yet')
        error = data.get('error', 'No error')
        existing_hints = data.get('existing_hints', [])  # Get all built-in hints
        
        # Get stage data based on room
        if room_id == 'football':
            if room_id not in ROOM_DATA:
                return jsonify({'error': 'Room not found'}), 404
            
            stage = next((s for s in ROOM_DATA[room_id]['stages'] if s['id'] == stage_id), None)
            if not stage:
                return jsonify({'error': 'Stage not found'}), 404
            
            challenge = stage['description']
            db_info = stage['database_info']
            
        elif room_id == 'casino':
            # Get casino stage
            stage_response = get_casino_stage(stage_id)
            if isinstance(stage_response, tuple) and stage_response[1] == 404:
                return jsonify({'error': 'Stage not found'}), 404
            
            if isinstance(stage_response, tuple):
                stage = stage_response[0].get_json()
            else:
                stage = stage_response.get_json()
            
            challenge = stage['description']
            db_info = stage['database_info']
        elif room_id == 'space':
            if room_id not in ROOM_DATA:
                return jsonify({'error': 'Room not found'}), 404

            stage = next((s for s in ROOM_DATA[room_id]['stages'] if s['id'] == stage_id), None)
            if not stage:
                return jsonify({'error': 'Stage not found'}), 404

            challenge = stage['description']
            db_info = stage['database_info']
        else:
            return jsonify({'error': 'Room not found'}), 404
        
        # Build hints text showing all existing hints
        hints_text = ""
        if existing_hints:
            hints_text = "\n\n🚫 CRITICAL: These hints are ALREADY available to the student:\n"
            hints_text += "\n".join([f"- {hint}" for hint in existing_hints])
            hints_text += "\n\n⚡ YOUR HINT MUST:\n"
            hints_text += "- Be COMPLETELY DIFFERENT from all hints above\n"
            hints_text += "- Provide UNIQUE value that the regular hints don't cover\n"
            hints_text += "- Take a DIFFERENT ANGLE or approach to the problem\n"
            hints_text += "- Focus on STRATEGY and THINKING, not exact syntax"
        
# Replace the prompt section in get_ai_hint() function with this improved version:

        # Build the enhanced prompt for Gemini
        prompt = f"""You are an expert SQL tutor. Your mission: provide a STRATEGIC hint that helps students THINK differently.

Challenge: {challenge}
Database Schema: {db_info}
Student's last query: {last_query}
Error/Issue: {error}{hints_text}

🎯 CRITICAL RULES:
1. DO NOT use technical SQL keywords that appear in existing hints (WHERE, AND, OR, SELECT, etc.)
2. DO NOT mention specific values from the hints (like 'Forward', '20', column names)
3. MUST use strategic thinking words: "think about", "consider", "ask yourself", "approach", "strategy"
4. MUST be 1-2 sentences maximum
5. Focus on the PROCESS of solving, not the SYNTAX

🎓 EXAMPLES OF GOOD STRATEGIC HINTS:

If no query yet:
✅ "Think about this in two steps: first identify WHAT type of records you need, then HOW to measure their performance."
✅ "Ask yourself: what makes a player qualify for this list? Break it into separate criteria."

If missing filters:
✅ "You're looking at everyone in the dataset. Consider: what requirements must each record meet to be included?"
✅ "Think about adding conditions that narrow down your results. What makes some records relevant and others not?"

If partially correct:
✅ "Great progress! Now think: are you requiring ALL conditions to be true, or just ONE of them?"
✅ "You've got part of it! Consider: when you have multiple requirements, how do they work together?"

If syntax error:
✅ "Think about how SQL knows the difference between your data values and column names in your table."
✅ "Consider: how does SQL understand what's literal text versus what's a reference to a column?"

🚫 BAD EXAMPLES (too technical):
❌ "Use WHERE to filter"
❌ "You need AND instead of OR"  
❌ "Add goals_scored > 20"

Now provide your strategic hint:"""

        # Rest of the function stays the same...
        # Call Gemini API
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        hint = response.text
        
        return jsonify({
            'hint': hint,
            'cost': 30  # 30 points penalty
        })
        
    except Exception as e:
        print(f"❌ AI Hint Error: {str(e)}")
        return jsonify({
            'error': 'Failed to generate AI hint. Please try the regular hints instead.',
            'details': str(e)
        }), 500

def initialize_app():
    """Initialize database and sample data"""
    with app.app_context():
        db.create_all()
        print("✅ Main database tables created!")
        create_sample_database()
        create_football_database()
        create_casino_database()
        create_space_database()

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
