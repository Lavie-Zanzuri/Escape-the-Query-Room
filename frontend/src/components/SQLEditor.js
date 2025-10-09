import React, { useState } from 'react';
import './SQLEditor.css';

const SQLEditor = ({ roomId = 'sample', onQuerySuccess, hideDbInfo = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Use roomId to determine which database to query
      const endpoint = roomId === 'sample' 
        ? 'http://localhost:5000/api/execute-sql'
        : `http://localhost:5000/api/execute-sql/${roomId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        setError(null);
        
        // Notify parent component of successful query
        if (onQuerySuccess) {
          onQuerySuccess(data);
        }
      } else {
        setError(data.error || 'Query failed');
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
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  // Get database info based on roomId
  const getDatabaseInfo = () => {
    switch(roomId) {
      case 'football':
        return {
          name: 'UEFA Football Database',
          tables: 'teams, players, matches',
          icon: '⚽'
        };
      case 'casino':
        return {
          name: 'Casino Database',
          tables: 'slot_machines, players, games, employees, suspicious_events',
          icon: '🎰'
        };
      case 'space':
        return {
          name: 'Orbital Space Station Database',
          tables: 'modules, crew_members, system_alerts, sensor_readings, maintenance_logs',
          icon: '🚀'
        };
      case 'sample':
      default:
        return {
          name: 'Sample Database',
          tables: 'students, courses, enrollments',
          icon: '🎓'
        };
    }
  };

  const dbInfo = getDatabaseInfo();

  return (
    <div className="sql-editor">
      <div className="query-section">
        <label className="query-label">SQL Query Editor:</label>
        <textarea
          className="query-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your SQL query here..."
        />
      </div>

      <div className="button-group">
        <button 
          className="btn btn-execute" 
          onClick={executeQuery} 
          disabled={loading}
        >
          {loading ? '⏳ Executing...' : '🚀 Run Query'}
        </button>
        <button 
          className="btn btn-clear" 
          onClick={clearQuery}
          disabled={loading}
        >
          🗑️ Clear
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && results.data && (
        <div className="results-section">
          <div className="results-header">
            <h3>Query Results</h3>
            <span className="results-meta">
              {results.row_count} row{results.row_count !== 1 ? 's' : ''} returned
            </span>
          </div>

          {results.data.length > 0 ? (
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    {results.columns.map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {results.columns.map((column, colIndex) => (
                        <td key={colIndex}>
                          {row[column] !== null ? String(row[column]) : 'NULL'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="success-message">
              Query executed successfully, but returned no data.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SQLEditor;
