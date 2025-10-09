import React from 'react';
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

function MainMenu({ onSelectRoom }) {
  return (
    <>
      <GlobalStyle />
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
      </MenuContainer>
    </>
  );
}

export default MainMenu;
