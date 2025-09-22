import React from 'react';
import styled from 'styled-components';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Arial', sans-serif;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 600px;
  line-height: 1.6;
`;

const StatusCard = styled.div`
  background: rgba(255,255,255,0.1);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  min-width: 300px;
  text-align: center;
`;

const TestButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);

  &:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4CAF50;
  border-radius: 10px;
  padding: 20px;
  margin-top: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
`;

function App() {
  const [backendStatus, setBackendStatus] = React.useState('🔄 Checking backend connection...');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/test');
      const data = await response.json();
      setBackendStatus(`✅ Backend Connected Successfully!`);
      setIsConnected(true);
      console.log('Backend response:', data);
    } catch (error) {
      setBackendStatus('❌ Backend not connected. Make sure Flask server is running on port 5000.');
      setIsConnected(false);
      console.error('Connection error:', error);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    // Test connection when component mounts
    setTimeout(testBackendConnection, 1000);
  }, []);

  return (
    <AppContainer>
      <Title>🎯 SQL Quest</Title>
      <Subtitle>
        Master SQL through interactive database escape rooms!<br/>
        Solve puzzles, unlock doors, and become a database hero.
      </Subtitle>
      
      <StatusCard>
        <strong>Connection Status:</strong><br/>
        <div style={{ marginTop: '10px', fontSize: '1.1rem' }}>
          {backendStatus}
        </div>
      </StatusCard>

      <TestButton onClick={testBackendConnection} disabled={isLoading}>
        {isLoading ? '🔄 Testing Connection...' : '🔄 Test Backend Connection'}
      </TestButton>

      {isConnected && (
        <SuccessMessage>
          <h3>🎉 Setup Complete!</h3>
          <p>✅ React Frontend: Running on port 3000</p>
          <p>✅ Flask Backend: Running on port 5000</p>
          <p>✅ Database: SQLite with sample data created</p>
          <p><strong>Ready to start building the SQL escape room game!</strong></p>
        </SuccessMessage>
      )}

      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        fontSize: '0.9rem', 
        opacity: '0.7' 
      }}>
        Phase 1.1: Project Foundation ✅ Complete
      </div>
    </AppContainer>
  );
}

export default App;