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

const UsernameDisplay = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(0,255,65,0.7);
  font-weight: bold;
  
  span {
    color: #00ff41;
    text-shadow: 0 0 10px #00ff41;
  }
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

const LeaderboardButton = styled.button`
  margin-top: 3rem;
  padding: 1.2rem 2.5rem;
  background: rgba(0,0,0,0.8);
  border: 2px solid #00ff41;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0,255,65,0.3);

  &:hover {
    background: rgba(0,255,65,0.1);
    box-shadow: 0 0 40px rgba(0,255,65,0.6);
    transform: translateY(-3px);
  }
`;

const LeaderboardOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LeaderboardModal = styled.div`
  background: rgba(0,0,0,0.95);
  border: 3px solid #00ff41;
  border-radius: 0;
  box-shadow: 0 0 50px rgba(0,255,65,0.5);
  max-width: 900px;
  width: 100%;
  padding: 2.5rem;
  position: relative;
  font-family: 'Courier New', monospace;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: 2px solid #00ff41;
  color: #00ff41;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0,255,65,0.2);
    transform: rotate(90deg);
  }
`;

const LeaderboardTitle = styled.h2`
  font-size: 2.5rem;
  color: #00ff41;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 0 15px #00ff41;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RoomTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const RoomTab = styled.button`
  padding: 0.8rem 1.5rem;
  background: ${props => props.active ? 'rgba(0,255,65,0.2)' : 'rgba(0,0,0,0.6)'};
  border: 2px solid ${props => props.active ? '#00ff41' : '#666'};
  color: ${props => props.active ? '#00ff41' : '#999'};
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #00ff41;
    color: #00ff41;
  }
`;

const LeaderboardTable = styled.div`
  border: 2px solid rgba(0,255,65,0.3);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 180px;
  background: rgba(0,255,65,0.15);
  border-bottom: 2px solid #00ff41;
  padding: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  color: #00ff41;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 180px;
  padding: 1rem;
  border-bottom: 1px solid rgba(0,255,65,0.1);
  background: ${props => props.index % 2 === 0 ? 'rgba(0,0,0,0.6)' : 'rgba(0,255,65,0.05)'};
  color: ${props => props.isCurrentUser ? '#ffd700' : '#00ff41'};
  border-left: ${props => props.isCurrentUser ? '4px solid #ffd700' : 'none'};
  
  &:hover {
    background: rgba(0,255,65,0.1);
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: rgba(0,255,65,0.5);
  font-style: italic;
`;

const LoadingState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #00ff41;
  font-size: 1.2rem;
  animation: ${pulse} 1.5s infinite;
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
            <UsernameDisplay>
              LOGGED IN AS: <span>{username}</span>
            </UsernameDisplay>
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
            <RoomMeta>5 STAGES</RoomMeta>
          </RoomCard>

          <RoomCard onClick={() => onSelectRoom('casino')}>
            <StatusBadge>AVAILABLE</StatusBadge>
            <RoomIcon>🎰</RoomIcon>
            <RoomTitle>Casino Heist</RoomTitle>
            <RoomDescription>
              Hack into the casino's rigged system and expose the fraud. Track rigged machines, identify victims, and catch the mastermind.
            </RoomDescription>
            <RoomMeta>5 STAGES</RoomMeta>
          </RoomCard>

          <RoomCard onClick={() => onSelectRoom('space')}>
            <StatusBadge>AVAILABLE</StatusBadge>
            <RoomIcon>🚀</RoomIcon>
            <RoomTitle>Space Station</RoomTitle>
            <RoomDescription>
              Stabilise the Helios orbital station after a cascade failure. Analyse crew rosters, sensor telemetry, and maintenance risks to save the mission.
            </RoomDescription>
            <RoomMeta>5 STAGES</RoomMeta>
          </RoomCard>
        </RoomsGrid>

        <LeaderboardButton onClick={() => setLeaderboardOpen(true)}>
          🏅 VIEW GLOBAL LEADERBOARDS
        </LeaderboardButton>
      </MenuContainer>

      {leaderboardOpen && (
        <LeaderboardOverlay onClick={() => setLeaderboardOpen(false)}>
          <LeaderboardModal onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setLeaderboardOpen(false)}>×</CloseButton>
            
            <LeaderboardTitle>
              <span>🏆</span> GLOBAL LEADERBOARDS
            </LeaderboardTitle>

            <RoomTabs>
              {rooms.map((room) => (
                <RoomTab
                  key={room.id}
                  active={activeRoom === room.id}
                  onClick={() => setActiveRoom(room.id)}
                >
                  {room.icon} {room.label}
                </RoomTab>
              ))}
            </RoomTabs>

            {leaderboardLoading ? (
              <LoadingState>&gt; LOADING DATA...</LoadingState>
            ) : leaderboardError ? (
              <EmptyState>&gt; ERROR: {leaderboardError}</EmptyState>
            ) : (
              <LeaderboardTable>
                <TableHeader>
                  <div>RANK</div>
                  <div>PLAYER</div>
                  <div>SCORE</div>
                  <div>TIME</div>
                  <div>COMPLETED</div>
                </TableHeader>
                {(leaderboards[activeRoom] || []).length > 0 ? (
                  (leaderboards[activeRoom] || []).map((run, index) => {
                    const isCurrentUser = username && run.username === username;
                    return (
                      <TableRow key={`${run.username}-${run.completed_at}`} index={index} isCurrentUser={isCurrentUser}>
                        <div>#{index + 1}</div>
                        <div>{run.username}</div>
                        <div>{run.score}</div>
                        <div>{formatSeconds(run.total_time)}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {new Date(run.completed_at).toLocaleString()}
                        </div>
                      </TableRow>
                    );
                  })
                ) : (
                  <EmptyState>
                    &gt; NO RECORDS FOUND<br/>
                    &gt; BE THE FIRST TO SET A RECORD
                  </EmptyState>
                )}
              </LeaderboardTable>
            )}
          </LeaderboardModal>
        </LeaderboardOverlay>
      )}
    </>
  );
}

export default MainMenu;