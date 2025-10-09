import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

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
      radial-gradient(2px 2px at 40px 70px, rgba(0,255,65,0.3), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: ${matrixRain} 20s linear infinite;
    opacity: 0.1;
  }
`;

const MenuContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
`;

const TerminalHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
  animation: ${glitch} 3s infinite;
`;

const TerminalText = styled.div`
  font-family: 'Courier New', monospace;
  color: #00ff41;
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  max-width: 600px;
  line-height: 1.6;
`;

const GameTitle = styled.h1`
  font-size: 5rem;
  font-weight: bold;
  margin: 2rem 0;
  text-shadow: 
    0 0 5px #00ff41,
    0 0 10px #00ff41,
    0 0 15px #00ff41,
    0 0 20px #00ff41;
  letter-spacing: 5px;
  border: 3px solid #00ff41;
  padding: 30px 60px;
  background: rgba(0,255,65,0.05);
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 3rem;
    padding: 20px 30px;
  }
`;

const Subtitle = styled.div`
  font-size: 1.3rem;
  margin-top: 1rem;
  opacity: 0.9;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #00ff41;
`;

const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  max-width: 1200px;
  width: 100%;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const RoomCard = styled.div`
  background: rgba(0,0,0,0.8);
  border: 2px solid #00ff41;
  padding: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0,255,65,0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 0 30px rgba(0,255,65,0.5);
    border-color: #00ff41;
    background: rgba(0,255,65,0.1);
  }

  &:hover::before {
    left: 100%;
  }

  &.coming-soon {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
  }

  &.coming-soon:hover {
    transform: none;
    box-shadow: none;
    background: rgba(0,0,0,0.8);
  }
`;

const RoomIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  animation: ${pulse} 2s infinite;
  text-align: center;
`;

const RoomTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 15px;
  color: #00ff41;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #00ff41;
  text-align: center;
`;

const RoomDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  opacity: 0.9;
  text-align: center;
`;

const RoomMeta = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0,255,65,0.3);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  color: #ffd700;
  font-weight: bold;
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0,255,65,0.2);
  border: 1px solid #00ff41;
  padding: 5px 15px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: bold;
`;

function MainMenu({ onSelectRoom, username }) {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState('football');
  const [leaderboards, setLeaderboards] = useState({});
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  const rooms = [
    { id: 'football', label: 'Football Stadium', icon: '⚽' },
    { id: 'casino', label: 'Casino Heist', icon: '🎰' },
    { id: 'space', label: 'Space Station', icon: '🚀' }
  ];

  useEffect(() => {
    if (!leaderboardOpen) return;
    if (leaderboards[activeRoom]) return;

    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        setLeaderboardError(null);
        const response = await fetch(`http://localhost:5000/api/leaderboard/${activeRoom}`);
        const data = await response.json();
        if (data.runs) {
          setLeaderboards((prev) => ({ ...prev, [activeRoom]: data.runs }));
        } else {
          throw new Error(data.error || 'Failed to load leaderboard');
        }
      } catch (error) {
        setLeaderboardError(error.message);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardOpen, activeRoom, leaderboards]);

  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const openLeaderboard = () => {
    setLeaderboardOpen(true);
    setActiveRoom('football');
  };

  const closeLeaderboard = () => {
    setLeaderboardOpen(false);
    setLeaderboardError(null);
  };

  return (
    <>
      <GlobalStyle />
      <VideoBackground autoPlay muted loop playsInline preload="auto">
        <source src="/videos/Generated%20File%20October%2009,%202025%20-%205_08PM.mp4" type="video/mp4" />
      </VideoBackground>
      <MatrixBackground />
      <MenuContainer>
        <TerminalHeader>
          <TerminalText>
            &gt; SYSTEM INITIALIZING...<br/>
            &gt; SCANNING AVAILABLE ESCAPE ROOMS...<br/>
            &gt; ACCESS GRANTED<br/>
            &gt; SELECT YOUR MISSION
          </TerminalText>
          <GameTitle>Escape the Query Room</GameTitle>
          <Subtitle>// SELECT YOUR ESCAPE ROOM //</Subtitle>
          {username && (
            <div className="mt-4 text-center text-sm text-emerald-300 font-bold">
              Logged in as: <span className="text-white">{username}</span>
            </div>
          )}
        </TerminalHeader>

        <RoomsGrid>
          <RoomCard onClick={() => onSelectRoom('football')}>
            <StatusBadge>AVAILABLE</StatusBadge>
            <RoomIcon>⚽</RoomIcon>
            <RoomTitle>Football Stadium</RoomTitle>
            <RoomDescription>
              Infiltrate the UEFA database to expose corruption. Navigate through player records, team finances, and suspicious match results.
            </RoomDescription>
            <RoomMeta>
              5 STAGES
            </RoomMeta>
          </RoomCard>

          <RoomCard onClick={() => onSelectRoom('casino')}>
            <StatusBadge>AVAILABLE</StatusBadge>
            <RoomIcon>🎰</RoomIcon>
            <RoomTitle>Casino Heist</RoomTitle>
            <RoomDescription>
              Hack into the casino's rigged system and expose the fraud. Track rigged machines, identify victims, and catch the mastermind.
            </RoomDescription>
            <RoomMeta>
              5 STAGES
            </RoomMeta>
          </RoomCard>

          <RoomCard onClick={() => onSelectRoom('space')}>
            <StatusBadge>AVAILABLE</StatusBadge>
            <RoomIcon>🚀</RoomIcon>
            <RoomTitle>Space Station</RoomTitle>
            <RoomDescription>
              Stabilise the Helios orbital station after a cascade failure. Analyse crew rosters, sensor telemetry, and maintenance risks to save the mission.
            </RoomDescription>
            <RoomMeta>
              5 STAGES
            </RoomMeta>
          </RoomCard>
        </RoomsGrid>

        <button
          onClick={openLeaderboard}
          className="mt-12 px-8 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-400 to-cyan-500 text-black hover:from-emerald-300 hover:to-cyan-400 transition shadow-2xl"
          style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
        >
          🏅 View Global Leaderboards
        </button>
      </MenuContainer>

      {leaderboardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
          <div className="bg-gray-900/95 border border-emerald-400/40 rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative">
            <button
              onClick={closeLeaderboard}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
              <span>🏆</span> Global Leaderboards
            </h2>

            <div className="flex gap-3 mb-6">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`px-4 py-2 rounded-xl font-bold transition ${activeRoom === room.id ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {room.icon} {room.label}
                </button>
              ))}
            </div>

            {leaderboardLoading ? (
              <div className="text-center text-gray-300">Loading leaderboard...</div>
            ) : leaderboardError ? (
              <div className="text-center text-red-400">{leaderboardError}</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-700">
                <table className="w-full">
                  <thead className="bg-emerald-500/20 text-emerald-200 uppercase text-sm">
                    <tr>
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Player</th>
                      <th className="py-3 px-4 text-left">Score</th>
                      <th className="py-3 px-4 text-left">Total Time</th>
                      <th className="py-3 px-4 text-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaderboards[activeRoom] || []).map((run, index) => {
                      const isCurrentUser = username && run.username === username;
                      return (
                        <tr
                          key={`${run.username}-${run.completed_at}`}
                          className={`${index % 2 === 0 ? 'bg-gray-900/60' : 'bg-gray-800/40'} ${isCurrentUser ? 'border-l-4 border-emerald-400' : ''}`}
                        >
                          <td className="py-3 px-4 text-gray-300 font-bold">#{index + 1}</td>
                          <td className="py-3 px-4 text-white font-semibold">{run.username}</td>
                          <td className="py-3 px-4 text-emerald-300 font-black">{run.score}</td>
                          <td className="py-3 px-4 text-gray-200">{formatSeconds(run.total_time)}</td>
                          <td className="py-3 px-4 text-gray-500 text-sm">{new Date(run.completed_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {(!leaderboards[activeRoom] || leaderboards[activeRoom].length === 0) && (
                      <tr>
                        <td className="py-6 px-4 text-center text-gray-400" colSpan={5}>
                          No runs recorded yet. Be the first to set a record!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MainMenu;
