// src/components/SQLEditor.js
import React, { useState } from 'react';
import styled from 'styled-components';

const EditorContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
`;

const Title = styled.h2`
  color: #333;
  margin: 0;
  font-size: 1.5rem;
`;

const DatabaseInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
  background: #f0f8ff;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
`;

const QuerySection = styled.div`
  margin-bottom: 20px;
`;

const QueryLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
`;

const QueryTextarea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background: #f9f9f9;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    background: white;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.2);
  }

  &::placeholder {
    color: #999;
    font-style: italic;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RunButton = styled(Button)`
  background: #4CAF50;
  color: white;

  &:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
`;

const ClearButton = styled(Button)`
  background: #f44336;
  color: white;

  &:hover:not(:disabled) {
    background: #da190b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
`;

const ExampleButton = styled(Button)`
  background: #2196F3;
  color: white;

  &:hover:not(:disabled) {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
`;

const ResultsSection = styled.div`
  margin-top: 20px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ResultsTitle = styled.h3`
  color: #333;
  margin: 0;
`;

const ResultsMeta = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  background: #4CAF50;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
  
  &:nth-child(even) {
    background: #f9f9f9;
  }
`;

const TableRow = styled.tr`
  &:hover {
    background: #f0f8ff;
  }

  &:nth-child(even) {
    background: #f9f9f9;
    
    &:hover {
      background: #f0f8ff;
    }
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 15px;
  color: #c62828;
  margin-top: 10px;
`;

const SuccessMessage = styled.div`
  background: #e8f5e8;
  border: 1px solid #4CAF50;
  border-radius: 8px;
  padding: 15px;
  color: #2e7d32;
  margin-top: 10px;
`;

const ExampleQueries = [
  {
    name: "All Students",
    query: "SELECT * FROM students;"
  },
  {
    name: "CS Students",
    query: "SELECT name, gpa FROM students WHERE major = 'Computer Science' ORDER BY gpa DESC;"
  },
  {
    name: "High GPA",
    query: "SELECT name, major, gpa FROM students WHERE gpa > 3.5;"
  },
  {
    name: "Student Enrollments",
    query: "SELECT s.name, c.course_name, e.grade\nFROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.course_id;"
  },
  {
    name: "Students by Major",
    query: "SELECT major, COUNT(*) as student_count, AVG(gpa) as avg_gpa\nFROM students\nGROUP BY major\nORDER BY student_count DESC;"
  }
];

const SQLEditor = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:5000/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      setError(`Connection error: ${err.message}`);
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
    // Ctrl+Enter או Cmd+Enter להרצת השאילתה
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <Title>🎯 SQL Quest - Interactive Database</Title>
        <DatabaseInfo>
          📊 Tables: students, courses, enrollments
        </DatabaseInfo>
      </EditorHeader>

      <QuerySection>
        <QueryLabel>📝 SQL Query Editor:</QueryLabel>
        <QueryTextarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Write your SQL query here...

Examples:
SELECT * FROM students;
SELECT name, gpa FROM students WHERE major = 'Computer Science';

Press Ctrl+Enter (or Cmd+Enter) to run the query`}
        />
      </QuerySection>

      <ButtonGroup>
        <RunButton onClick={executeQuery} disabled={loading}>
          {loading ? '⏳ Running...' : '🚀 Run Query'}
        </RunButton>
        <ClearButton onClick={clearQuery}>
          🗑️ Clear
        </ClearButton>
        {ExampleQueries.map((example, index) => (
          <ExampleButton 
            key={index}
            onClick={() => loadExample(example.query)}
          >
            💡 {example.name}
          </ExampleButton>
        ))}
      </ButtonGroup>

      {error && (
        <ErrorMessage>
          ❌ Error: {error}
        </ErrorMessage>
      )}

      {results && (
        <ResultsSection>
          <ResultsHeader>
            <ResultsTitle>📊 Query Results</ResultsTitle>
            <ResultsMeta>
              {results.row_count} rows found
              {executionTime && ` • Executed in ${executionTime}ms`}
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
              ✅ Query executed successfully, but no results returned.
            </SuccessMessage>
          )}
        </ResultsSection>
      )}
    </EditorContainer>
  );
};

export default SQLEditor;