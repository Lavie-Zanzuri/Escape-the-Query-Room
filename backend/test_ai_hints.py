"""
AI Hint Testing Script
Tests the AI hint system to ensure it meets requirements
"""

import requests
import json
from colorama import init, Fore, Style
import time

# Initialize colorama for colored output
init(autoreset=True)

# API Configuration
BASE_URL = 'http://localhost:5000'
ROOM_ID = 'football'
STAGE_ID = 2  # Test with stage 2 (Forwards with > 20 goals)

# Test scenarios
TEST_SCENARIOS = [
    {
        'name': 'Scenario 1: No Query Yet',
        'description': 'User has not attempted any query',
        'payload': {
            'last_query': 'No query attempted yet',
            'error': 'No error',
            'existing_hints': [
                'Use WHERE clause to filter results',
                'Combine multiple conditions with AND',
                'Filter by position = \'Forward\' AND goals_scored > 20',
                'Select specific columns: name, position, goals_scored'
            ]
        },
        'expectations': {
            'should_contain': ['think', 'step', 'start', 'approach', 'strategy'],
            'should_not_contain': ['WHERE', 'AND', 'Forward', 'goals_scored > 20'],
            'max_sentences': 3,
            'should_be_encouraging': True
        }
    },
    {
        'name': 'Scenario 2: Missing WHERE Clause',
        'description': 'User forgot to filter the results',
        'payload': {
            'last_query': 'SELECT * FROM players',
            'error': 'Your query returned too many results',
            'existing_hints': [
                'Use WHERE clause to filter results',
                'Combine multiple conditions with AND',
                'Filter by position = \'Forward\' AND goals_scored > 20',
                'Select specific columns: name, position, goals_scored'
            ]
        },
        'expectations': {
            'should_contain': ['filter', 'condition', 'narrow', 'specific'],
            'should_not_contain': ['WHERE position', 'Forward', 'goals_scored > 20'],
            'max_sentences': 3,
            'mentions_error': True
        }
    },
    {
        'name': 'Scenario 3: Only Position Filter',
        'description': 'User filtered by position but forgot goals condition',
        'payload': {
            'last_query': 'SELECT name FROM players WHERE position = \'Forward\'',
            'error': 'Some players have 20 goals or less',
            'existing_hints': [
                'Use WHERE clause to filter results',
                'Combine multiple conditions with AND',
                'Filter by position = \'Forward\' AND goals_scored > 20',
                'Select specific columns: name, position, goals_scored'
            ]
        },
        'expectations': {
            'should_contain': ['another', 'second', 'additional', 'combine', 'both'],
            'should_not_contain': ['goals_scored > 20', 'AND goals_scored'],
            'max_sentences': 3,
            'acknowledges_progress': True
        }
    },
    {
        'name': 'Scenario 4: Syntax Error',
        'description': 'User has a SQL syntax error',
        'payload': {
            'last_query': 'SELECT * FROM players WHERE position = Forward',
            'error': 'Query error: no such column: Forward',
            'existing_hints': [
                'Use WHERE clause to filter results',
                'Combine multiple conditions with AND',
                'Filter by position = \'Forward\' AND goals_scored > 20',
                'Select specific columns: name, position, goals_scored'
            ]
        },
        'expectations': {
            'should_contain': ['syntax', 'quotes', 'text', 'string'],
            'should_not_contain': ['Forward'],
            'max_sentences': 3,
            'mentions_error': True
        }
    },
    {
        'name': 'Scenario 5: Close to Solution',
        'description': 'User has both conditions but wrong operator',
        'payload': {
            'last_query': 'SELECT name FROM players WHERE position = \'Forward\' OR goals_scored > 20',
            'error': 'Your results include players who are not Forwards',
            'existing_hints': [
                'Use WHERE clause to filter results',
                'Combine multiple conditions with AND',
                'Filter by position = \'Forward\' AND goals_scored > 20',
                'Select specific columns: name, position, goals_scored'
            ]
        },
        'expectations': {
            'should_contain': ['both', 'all', 'together', 'operator'],
            'should_not_contain': ['AND', 'OR'],
            'max_sentences': 3,
            'strategic': True
        }
    }
]


def test_ai_hint(scenario):
    """Test a single AI hint scenario"""
    print(f"\n{Fore.CYAN}{'=' * 70}")
    print(f"{Fore.CYAN}Testing: {scenario['name']}")
    print(f"{Fore.WHITE}{scenario['description']}")
    print(f"{Fore.CYAN}{'=' * 70}\n")
    
    # Show what we're sending
    print(f"{Fore.YELLOW}📤 Sending to API:")
    print(f"{Fore.WHITE}Last Query: {scenario['payload']['last_query']}")
    print(f"{Fore.WHITE}Error: {scenario['payload']['error']}")
    print(f"{Fore.WHITE}Existing Hints: {len(scenario['payload']['existing_hints'])} hints\n")
    
    try:
        # Make API request
        url = f"{BASE_URL}/api/ai-hint/{ROOM_ID}/{STAGE_ID}"
        response = requests.post(url, json=scenario['payload'], timeout=30)
        
        if response.status_code != 200:
            print(f"{Fore.RED}❌ API Error: {response.status_code}")
            print(f"{Fore.RED}Response: {response.text}")
            return False
        
        result = response.json()
        hint = result.get('hint', '')
        
        print(f"{Fore.GREEN}📥 Received AI Hint:")
        print(f"{Fore.WHITE}{hint}\n")
        
        # Validate the hint
        return validate_hint(hint, scenario['expectations'], scenario['payload'])
        
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}❌ Cannot connect to server. Is it running on {BASE_URL}?")
        return False
    except Exception as e:
        print(f"{Fore.RED}❌ Error: {str(e)}")
        return False


def validate_hint(hint, expectations, payload):
    """Validate the AI hint against expectations"""
    hint_lower = hint.lower()
    passed = True
    
    print(f"{Fore.MAGENTA}🔍 Validation Results:")
    print(f"{Fore.MAGENTA}{'─' * 70}\n")
    
    # Check: Should contain certain words/concepts
    if 'should_contain' in expectations:
        found_count = 0
        for concept in expectations['should_contain']:
            if concept.lower() in hint_lower:
                found_count += 1
                print(f"{Fore.GREEN}✅ Contains strategic concept: '{concept}'")
        
        if found_count == 0:
            print(f"{Fore.RED}❌ Missing strategic concepts. Should contain at least one of: {expectations['should_contain']}")
            passed = False
        elif found_count < 2:
            print(f"{Fore.YELLOW}⚠️  Only {found_count} strategic concept found (expected 2+)")
    
    # Check: Should NOT contain specific text (to avoid duplication)
    if 'should_not_contain' in expectations:
        found_duplicates = []
        for duplicate in expectations['should_not_contain']:
            if duplicate.lower() in hint_lower:
                found_duplicates.append(duplicate)
        
        if found_duplicates:
            print(f"{Fore.RED}❌ Contains duplicated content from existing hints: {found_duplicates}")
            passed = False
        else:
            print(f"{Fore.GREEN}✅ Does not duplicate existing hints")
    
    # Check: Maximum sentences
    if 'max_sentences' in expectations:
        sentence_count = hint.count('.') + hint.count('!') + hint.count('?')
        if sentence_count <= expectations['max_sentences']:
            print(f"{Fore.GREEN}✅ Length appropriate: {sentence_count} sentences (max {expectations['max_sentences']})")
        else:
            print(f"{Fore.YELLOW}⚠️  Hint is long: {sentence_count} sentences (max {expectations['max_sentences']})")
    
    # Check: Mentions the error
    if expectations.get('mentions_error') and payload['error'] != 'No error':
        error_keywords = ['error', 'wrong', 'issue', 'problem', 'mistake']
        if any(keyword in hint_lower for keyword in error_keywords):
            print(f"{Fore.GREEN}✅ Addresses the user's error")
        else:
            print(f"{Fore.YELLOW}⚠️  Does not explicitly address the error")
    
    # Check: Acknowledges progress
    if expectations.get('acknowledges_progress'):
        progress_keywords = ['good', 'great', 'correct', 'right', 'progress', 'close', 'almost']
        if any(keyword in hint_lower for keyword in progress_keywords):
            print(f"{Fore.GREEN}✅ Acknowledges user's progress")
        else:
            print(f"{Fore.YELLOW}⚠️  Could be more encouraging about progress")
    
    # Check: Is encouraging
    if expectations.get('should_be_encouraging'):
        encouraging_keywords = ['think', 'try', 'can', 'help', 'guide', 'consider']
        if any(keyword in hint_lower for keyword in encouraging_keywords):
            print(f"{Fore.GREEN}✅ Tone is encouraging and helpful")
        else:
            print(f"{Fore.YELLOW}⚠️  Could be more encouraging")
    
    # Check: Is strategic (not just tactical)
    if expectations.get('strategic'):
        strategic_keywords = ['approach', 'strategy', 'think', 'consider', 'ask yourself', 'understand', 'concept']
        if any(keyword in hint_lower for keyword in strategic_keywords):
            print(f"{Fore.GREEN}✅ Provides strategic guidance")
        else:
            print(f"{Fore.YELLOW}⚠️  Could be more strategic")
    
    # Overall result
    print(f"\n{Fore.MAGENTA}{'─' * 70}")
    if passed:
        print(f"{Fore.GREEN}✅ SCENARIO PASSED")
    else:
        print(f"{Fore.RED}❌ SCENARIO FAILED")
    
    return passed


def run_all_tests():
    """Run all test scenarios"""
    print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 70}")
    print(f"{Fore.CYAN}{Style.BRIGHT}🧪 AI HINT TESTING SUITE")
    print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 70}\n")
    
    print(f"{Fore.WHITE}Testing AI hints for:")
    print(f"{Fore.WHITE}  Room: {ROOM_ID}")
    print(f"{Fore.WHITE}  Stage: {STAGE_ID}")
    print(f"{Fore.WHITE}  Scenarios: {len(TEST_SCENARIOS)}\n")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/api/test", timeout=5)
        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ Server is running\n")
        else:
            print(f"{Fore.RED}❌ Server responded with error: {response.status_code}")
            return
    except Exception as e:
        print(f"{Fore.RED}❌ Cannot connect to server at {BASE_URL}")
        print(f"{Fore.RED}Please start the backend server first: python3 app.py")
        return
    
    # Run tests
    results = []
    for i, scenario in enumerate(TEST_SCENARIOS, 1):
        print(f"\n{Fore.CYAN}{Style.BRIGHT}Test {i}/{len(TEST_SCENARIOS)}")
        passed = test_ai_hint(scenario)
        results.append({
            'name': scenario['name'],
            'passed': passed
        })
        
        # Delay between tests to avoid rate limiting
        if i < len(TEST_SCENARIOS):
            time.sleep(2)
    
    # Summary
    print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 70}")
    print(f"{Fore.CYAN}{Style.BRIGHT}📊 TEST SUMMARY")
    print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 70}\n")
    
    passed_count = sum(1 for r in results if r['passed'])
    total_count = len(results)
    
    for result in results:
        status = f"{Fore.GREEN}✅ PASS" if result['passed'] else f"{Fore.RED}❌ FAIL"
        print(f"{status} - {result['name']}")
    
    print(f"\n{Fore.CYAN}{'─' * 70}")
    print(f"{Fore.WHITE}Total: {passed_count}/{total_count} scenarios passed")
    
    if passed_count == total_count:
        print(f"{Fore.GREEN}{Style.BRIGHT}🎉 ALL TESTS PASSED!")
    else:
        print(f"{Fore.YELLOW}⚠️  Some tests need attention")
    
    print(f"{Fore.CYAN}{'=' * 70}\n")


if __name__ == '__main__':
    print(f"{Fore.CYAN}{Style.BRIGHT}\n🚀 Starting AI Hint Testing...\n")
    run_all_tests()