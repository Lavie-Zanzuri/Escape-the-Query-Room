import React, { useState } from 'react';
import MainMenu from './MainMenu';
import FootballRoom from './components/FootballRoom';
import CasinoRoom from './components/CasinoRoom';
import SQLQuestCyber from './App';

function RouterWrapper() {
  const [currentPage, setCurrentPage] = useState('menu');

  const handleSelectRoom = (roomId) => {
    console.log('Selected room:', roomId);
    if (roomId === 'football') {
      setCurrentPage('football');
    } else if (roomId === 'casino') {
      setCurrentPage('casino');
    } else if (roomId === 'cyber') {
      setCurrentPage('cyber');
    }
  };

  const handleBack = () => {
    console.log('Going back to menu');
    setCurrentPage('menu');
  };

  if (currentPage === 'menu') {
    return <MainMenu onSelectRoom={handleSelectRoom} />;
  }

  if (currentPage === 'football') {
    return (
      <>
        {/* MODERN STADIUM STYLE BACK BUTTON */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-[99999] group"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '3px solid rgba(74, 222, 128, 0.6)',
            padding: '16px 32px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '1.1rem',
            color: 'white',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Arial Black', Arial, sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.6), 0 0 60px rgba(74, 222, 128, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(74, 222, 128, 1) 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20, 83, 45, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '1.4rem',
              display: 'inline-block',
              transition: 'transform 0.3s ease'
            }} className="group-hover:-translate-x-1">
              ←
            </span>
            <span>MAIN MENU</span>
          </div>
        </button>

        {/* Pulsing indicator dot */}
        <div
          className="fixed top-8 left-8 w-3 h-3 rounded-full animate-pulse pointer-events-none z-[99998]"
          style={{
            background: 'rgba(74, 222, 128, 1)',
            boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)'
          }}
        />

        <FootballRoom onBack={handleBack} />
      </>
    );
  }

  if (currentPage === 'casino') {
    return (
      <>
        {/* CASINO STYLE BACK BUTTON */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-[99999] group"
          style={{
            background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '3px solid rgba(234, 179, 8, 0.8)',
            padding: '16px 32px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '1.1rem',
            color: '#FFD700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(234, 179, 8, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Arial Black', Arial, sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(234, 179, 8, 0.8), 0 0 60px rgba(255, 215, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.3)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(239, 68, 68, 1) 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(234, 179, 8, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.1)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '1.4rem',
              display: 'inline-block',
              transition: 'transform 0.3s ease'
            }} className="group-hover:-translate-x-1">
              ←
            </span>
            <span>MAIN MENU</span>
          </div>
        </button>

        {/* Pulsing indicator dot */}
        <div
          className="fixed top-8 left-8 w-3 h-3 rounded-full animate-pulse pointer-events-none z-[99998]"
          style={{
            background: 'rgba(234, 179, 8, 1)',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.8)'
          }}
        />

        <CasinoRoom onBack={handleBack} />
      </>
    );
  }

  if (currentPage === 'cyber') {
    return (
      <>
        {/* CYBER STYLE BACK BUTTON */}
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-[99999] group"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 200, 50, 0.3) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '2px solid #00ff41',
            padding: '16px 32px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: '#00ff41',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
            transition: 'all 0.3s ease',
            fontFamily: "'Courier New', monospace"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00ff41';
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.transform = 'translateX(-5px)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 200, 50, 0.3) 100%)';
            e.currentTarget.style.color = '#00ff41';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.3)';
          }}
        >
          {'< BACK TO MENU'}
        </button>
        <SQLQuestCyber />
      </>
    );
  }

  return <MainMenu onSelectRoom={handleSelectRoom} />;
}

export default RouterWrapper;