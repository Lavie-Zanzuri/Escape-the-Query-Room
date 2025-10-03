import React, { useState } from 'react';
import SQLQuestCyber from './App'; // הקובץ הקיים שלך
import FootballRoom from './components/FootballRoom';
import styled from 'styled-components';

const NavigationButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  background: transparent;
  border: 2px solid #00ff41;
  padding: 12px 25px;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  text-transform: uppercase;
  z-index: 9999;
  
  &:hover {
    background: #00ff41;
    color: #000;
    box-shadow: 0 0 20px #00ff41;
  }
`;

const BackButton = styled(NavigationButton)`
  border-color: #ff6b6b;
  color: #ff6b6b;
  left: 20px;
  right: auto;
  
  &:hover {
    background: #ff6b6b;
    color: #000;
    box-shadow: 0 0 20px #ff6b6b;
  }
`;

function RouterWrapper() {
  const [currentPage, setCurrentPage] = useState('cyber'); // 'cyber' או 'football'

  return (
    <>
      {currentPage === 'cyber' ? (
        <>
          <NavigationButton onClick={() => setCurrentPage('football')}>
            ⚽ FOOTBALL ROOM
          </NavigationButton>
          <SQLQuestCyber />
        </>
      ) : (
        <>
          <BackButton onClick={() => setCurrentPage('cyber')}>
            ← BACK TO TERMINAL
          </BackButton>
          <FootballRoom />
        </>
      )}
    </>
  );
}

export default RouterWrapper;