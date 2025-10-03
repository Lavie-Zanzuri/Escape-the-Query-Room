import React, { useState } from 'react';
import MainMenu from './MainMenu';
import FootballRoom from './components/FootballRoom';
import SQLQuestCyber from './App'; // הדף ה-Cyberpunk המקורי שלך

function RouterWrapper() {
  const [currentPage, setCurrentPage] = useState('menu'); // 'menu', 'football', 'cyber'

  const handleSelectRoom = (roomId) => {
    console.log('Selected room:', roomId);
    if (roomId === 'football') {
      setCurrentPage('football');
    } else if (roomId === 'cyber') {
      setCurrentPage('cyber');
    }
  };

  const handleBack = () => {
    console.log('Going back to menu');
    setCurrentPage('menu');
  };

  // רנדור לפי העמוד הנוכחי
  if (currentPage === 'menu') {
    return <MainMenu onSelectRoom={handleSelectRoom} />;
  }

  if (currentPage === 'football') {
    return (
      <>
        {/* Fixed Back Button */}
        <button
          onClick={handleBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 99999,
            background: 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '3px solid #fff',
            color: 'white',
            padding: '15px 30px',
            fontSize: '1.1em',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Arial Black', Arial, sans-serif",
            boxShadow: '0 4px 15px rgba(255, 59, 59, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff3b3b 100%)';
            e.target.style.transform = 'translateX(-5px) scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(255, 59, 59, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)';
            e.target.style.transform = 'none';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 59, 59, 0.4)';
          }}
        >
          ← BACK TO MENU
        </button>
        <FootballRoom onBack={handleBack} />
      </>
    );
  }

  if (currentPage === 'cyber') {
    return <SQLQuestCyber />;
  }

  // Fallback למקרה של state לא צפוי
  return <MainMenu onSelectRoom={handleSelectRoom} />;
}

export default RouterWrapper;