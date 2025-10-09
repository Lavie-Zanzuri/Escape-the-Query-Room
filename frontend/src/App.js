import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// Global styles for the cyberpunk theme
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Courier New', monospace;
    background: #0a0a0a;
    color: #00ff41;
    overflow-x: hidden;
  }
`;

// Animations
const matrixRain = keyframes`
  0% { transform: translateY(-100px); }
  100% { transform: translateY(100vh); }
`;

const glitch = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-2px); }
  40% { transform: translateX(2px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
`;

const scan = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const VideoBackground = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -3;
  filter: brightness(0.22);
`;

// Background with matrix effect
const MatrixBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0d1421 0%, #1a1a2e 50%, #16213e 100%);
  z-index: -2;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, #00ff41, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(0,255,65,0.3), transparent),
      radial-gradient(1px 1px at 90px 40px, #00ff41, transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(0,255,65,0.3), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: ${matrixRain} 20s linear infinite;
    opacity: 0.1;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  position: relative;
  background: 
    linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,255,65,0.03) 2px,
      rgba(0,255,65,0.03) 4px
    );
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  position: relative;
`;

const TerminalText = styled.div`
  font-family: 'Courier New', monospace;
  color: #00ff41;
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const GameTitle = styled.h1`
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 
    0 0 5px #00ff41,
    0 0 10px #00ff41,
    0 0 15px #00ff41;
  animation: ${glitch} 3s infinite;
  letter-spacing: 3px;
  border: 2px solid #00ff41;
  padding: 20px 40px;
  background: rgba(0,255,65,0.1);
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    padding: 15px 25px;
  }
`;

const Subtitle = styled.div`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.8;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const StatusCard = styled.div`
  background: rgba(0,0,0,0.9);
  border: 1px solid #00ff41;
  padding: 15px 25px;
  margin: 0 auto 30px;
  max-width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  &::before {
    content: 'SYSTEM STATUS';
    position: absolute;
    top: -10px;
    left: 20px;
    background: #0a0a0a;
    padding: 0 10px;
    font-size: 0.8rem;
    color: #00ff41;
    text-transform: uppercase;
  }
`;

const MainGameInterface = styled.div`
  background: rgba(0,0,0,0.9);
  border: 2px solid #00ff41;
  padding: 30px;
  margin: 0 auto;
  max-width: 1200px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #00ff41, transparent);
    animation: ${scan} 2s linear infinite;
  }

  &::after {
    content: '> QUERY TERMINAL ACTIVE';
    position: absolute;
    top: -15px;
    left: 30px;
    background: #0a0a0a;
    padding: 0 15px;
    font-size: 0.9rem;
    color: #00ff41;
    text-transform: uppercase;
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #00ff41;

  h2 {
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 5px #00ff41;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const StatusDisplay = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const StatusItem = styled.div`
  background: rgba(0,255,65,0.1);
  border: 1px solid #00ff41;
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;

  &.error {
    color: #ff6b6b;
    border-color: #ff6b6b;
    background: rgba(255,107,107,0.1);
  }
`;

const SQLEditor = styled.div`
  background: #000;
  border: 2px solid #00ff41;
  padding: 25px;
  margin-bottom: 25px;
  position: relative;

  &::before {
    content: 'DATABASE CONNECTION: SECURE';
    position: absolute;
    top: -12px;
    left: 25px;
    background: #0a0a0a;
    padding: 0 15px;
    font-size: 0.8rem;
    color: #00ff41;
    text-transform: uppercase;
  }
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #00ff41;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const DatabaseInfo = styled.div`
  background: rgba(0,255,65,0.1);
  border-left: 3px solid #00ff41;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

const SQLTextarea = styled.textarea`
  width: 100%;
  height: 200px;
  background: transparent;
  border: none;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  outline: none;
  line-height: 1.4;

  &::placeholder {
    color: rgba(0,255,65,0.5);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const CyberButton = styled.button`
  background: transparent;
  border: 2px solid #00ff41;
  padding: 12px 25px;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background: #00ff41;
    color: #000;
    box-shadow: 0 0 20px #00ff41;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: #666;
    color: #666;
  }

  &.execute {
    border-color: #00ff41;
    color: #00ff41;
    font-weight: bold;
  }

  &.clear {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  &.clear:hover:not(:disabled) {
    background: #ff6b6b;
    color: #000;
  }

  &.example {
    border-color: #ffc107;
    color: #ffc107;
  }

  &.example:hover:not(:disabled) {
    background: #ffc107;
    color: #000;
  }
`;

const ResultsSection = styled.div`
  margin-top: 25px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #00ff41;

  h3 {
    color: #00ff41;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const ResultsMeta = styled.div`
  color: #00ff41;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: rgba(0,0,0,0.8);
  border: 1px solid #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
`;

const TableHeader = styled.th`
  background: rgba(0,255,65,0.2);
  color: #00ff41;
  padding: 12px;
  text-align: left;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #00ff41;
`;

const TableCell = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0,255,65,0.3);
  color: #00ff41;
`;

const TableRow = styled.tr`
  &:hover {
    background: rgba(0,255,65,0.1);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255,107,107,0.1);
  border: 1px solid #ff6b6b;
  border-left: 4px solid #ff6b6b;
  padding: 20px;
  color: #ff6b6b;
  margin-top: 15px;
  font-family: 'Courier New', monospace;
  position: relative;

  &::before {
    content: '⚠ ERROR DETECTED';
    display: block;
    font-weight: bold;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
`;

const SuccessMessage = styled.div`
  background: rgba(0,255,65,0.1);
  border: 1px solid #00ff41;
  border-left: 4px solid #00ff41;
  padding: 20px;
  color: #00ff41;
  margin-top: 15px;
  font-family: 'Courier New', monospace;
  position: relative;

  &::before {
    content: '✓ OPERATION SUCCESSFUL';
    display: block;
    font-weight: bold;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
`;

const ConnectionError = styled.div`
  background: rgba(255,107,107,0.1);
  border: 2px solid #ff6b6b;
  padding: 30px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  color: #ff6b6b;
  
  h3 {
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  pre {
    background: rgba(0,0,0,0.5);
    padding: 15px;
    margin-top: 15px;
    border: 1px solid #ff6b6b;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }
`;

// Example queries data
const ExampleQueries = [
  {
    name: "All Records",
    query: "SELECT * FROM students;"
  },
  {
    name: "CS Students",
    query: "SELECT name, gpa FROM students WHERE major = 'Computer Science' ORDER BY gpa DESC;"
  },
  {
    name: "High Performers",
    query: "SELECT name, major, gpa FROM students WHERE gpa > 3.5;"
  },
  {
    name: "Join Query",
    query: "SELECT s.name, c.course_name, e.grade\nFROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.course_id;"
  }
];

function SQLQuestCyber() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('INITIALIZING...');

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test');
      const data = await response.json();
      setIsConnected(true);
      setConnectionStatus('SECURE CONNECTION');
    } catch (err) {
      setIsConnected(false);
      setConnectionStatus('CONNECTION FAILED');
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('No query provided');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:5000/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (data.success) {
        setResults(data);
        setError(null);
      } else {
        setError(data.error);
        setResults(null);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults(null);
    setError(null);
    setExecutionTime(null);
  };

  const loadExample = (exampleQuery) => {
    setQuery(exampleQuery);
    setResults(null);
    setError(null);
    setExecutionTime(null);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <>
      <GlobalStyle />
      <VideoBackground autoPlay muted loop playsInline preload="auto">
        <source src="/videos/Generated%20File%20October%2009,%202025%20-%205_08PM.mp4" type="video/mp4" />
      </VideoBackground>
      <MatrixBackground />
      <AppContainer>
        <Header>
          <TerminalText>
            &gt; SYSTEM INITIALIZING...<br/>
            &gt; SCANNING DATABASE NETWORK...<br/>
            &gt; ACCESS GRANTED<br/>
            &gt; WELCOME TO THE SQL TERMINAL
          </TerminalText>
          <GameTitle>ESCAPE THE QUERY ROOM</GameTitle>
          <Subtitle>// MASTER DATABASE QUERIES TO SURVIVE //</Subtitle>
          
          <StatusCard>
            <span>{connectionStatus}</span>
            <CyberButton onClick={testConnection} disabled={loading}>
              {loading ? 'SCANNING...' : 'REFRESH'}
            </CyberButton>
          </StatusCard>
        </Header>

        {isConnected ? (
          <MainGameInterface>
            <GameHeader>
              <h2>INFILTRATING: DATABASE CORE</h2>
              <StatusDisplay>
                <StatusItem>THREAT: MINIMAL</StatusItem>
                <StatusItem className={!isConnected ? 'error' : ''}>
                  STATUS: {isConnected ? 'ONLINE' : 'OFFLINE'}
                </StatusItem>
              </StatusDisplay>
            </GameHeader>

            <DatabaseInfo>
              <strong>📊 AVAILABLE TARGETS:</strong> students, courses, enrollments
              <br/>
              <strong>⚡ MISSION:</strong> Execute SQL commands to extract classified data
            </DatabaseInfo>

            <SQLEditor>
              <EditorHeader>
                <span>💻 TERMINAL ACCESS</span>
                <span>ENCRYPTION: ACTIVE</span>
              </EditorHeader>
              
              <SQLTextarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="-- ENTER SQL COMMAND --
SELECT * FROM students;
-- Use Ctrl+Enter to execute"
              />
            </SQLEditor>

            <ButtonGroup>
              <CyberButton 
                className="execute" 
                onClick={executeQuery} 
                disabled={loading}
              >
                {loading ? '⏳ EXECUTING...' : '🚀 [ EXECUTE QUERY ]'}
              </CyberButton>
              <CyberButton className="clear" onClick={clearQuery}>
                🗑️ [ CLEAR TERMINAL ]
              </CyberButton>
              {ExampleQueries.map((example, index) => (
                <CyberButton 
                  key={index}
                  className="example"
                  onClick={() => loadExample(example.query)}
                >
                  💡 {example.name}
                </CyberButton>
              ))}
            </ButtonGroup>

            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}

            {results && (
              <ResultsSection>
                <ResultsHeader>
                  <h3>📊 DATA EXTRACTED</h3>
                  <ResultsMeta>
                    {results.row_count} RECORDS FOUND
                    {executionTime && ` • EXECUTED IN ${executionTime}MS`}
                  </ResultsMeta>
                </ResultsHeader>

                {results.data && results.data.length > 0 ? (
                  <ResultsTable>
                    <thead>
                      <tr>
                        {results.columns.map((column, index) => (
                          <TableHeader key={index}>{column}</TableHeader>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {results.columns.map((column, colIndex) => (
                            <TableCell key={colIndex}>
                              {row[column] !== null ? String(row[column]) : 'NULL'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </tbody>
                  </ResultsTable>
                ) : (
                  <SuccessMessage>
                    Query executed successfully, but no data returned.
                  </SuccessMessage>
                )}
              </ResultsSection>
            )}
          </MainGameInterface>
        ) : (
          <ConnectionError>
            <h3>⚠️ SYSTEM BREACH DETECTED</h3>
            <p>Database connection compromised. Restore backend server to continue operation.</p>
            <pre>
cd backend{'\n'}python3 app.py
            </pre>
          </ConnectionError>
        )}
      </AppContainer>
    </>
  );
}

export default SQLQuestCyber;
