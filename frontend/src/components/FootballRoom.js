import React, { useState, useEffect } from 'react';
import SQLEditor from './SQLEditor';
import './FootballRoom.css';

const FootballRoom = ({ onBack }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [roomData, setRoomData] = useState(null);
  const [stageData, setStageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [crowdSound, setCrowdSound] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    loadRoomData();
  }, []);

  useEffect(() => {
    if (roomData) {
      loadStageData();
    }
  }, [currentStage, roomData]);

  const loadRoomData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms/football');
      const data = await response.json();
      setRoomData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading room data:', error);
      setLoading(false);
    }
  };

  const loadStageData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/football/stage/${currentStage}`);
      const data = await response.json();
      setStageData(data);
      setStageComplete(false);
      setShowHint(false);
      setCurrentHintIndex(0);
      setValidationError(null);
    } catch (error) {
      console.error('Error loading stage data:', error);
    }
  };

  const handleQuerySuccess = async (result) => {
    if (result.success && result.row_count > 0 && !stageComplete) {
      try {
        // Send results to backend for validation
        const response = await fetch(`http://localhost:5000/api/validate-query/football/${currentStage}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            results: result.data,
            row_count: result.row_count 
          })
        });
        
        const validation = await response.json();
        
        if (validation.valid) {
          // Correct answer!
          setStageComplete(true);
          setValidationError(null);
          const stageScore = 100 - (currentHintIndex * 20);
          setTotalScore((prev) => prev + stageScore);
        } else {
          // Incorrect answer
          setValidationError(validation.message || 'The query result is not correct. Try again!');
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidationError('Error validating your query. Please try again.');
      }
    } else if (result.success && result.row_count === 0) {
      setValidationError('Your query returned no results. Make sure your query is correct.');
    }
  };

  const nextStage = () => {
    if (roomData && currentStage < roomData.stages.length) {
      setCurrentStage(currentStage + 1);
    }
  };

  const showNextHint = () => {
    if (stageData && currentHintIndex < stageData.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      setShowHint(true);
    } else {
      setShowHint(true);
    }
  };

  if (loading) {
    return (
      <div className="football-room loading">
        <div className="loading-spinner">Loading Football Stadium...</div>
      </div>
    );
  }

  if (!roomData || !stageData) {
    return (
      <div className="football-room error">
        <h2>Error loading room data</h2>
        <button onClick={loadRoomData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="football-room">
      <div className="room-header">
        <h1>⚽ {roomData.name}</h1>
        <button
          type="button"
          className={`sound-toggle${crowdSound ? ' active' : ''}`}
          onClick={() => setCrowdSound(!crowdSound)}
          aria-pressed={crowdSound}
        >
          {crowdSound ? '🔊 Crowd On' : '🔇 Crowd Off'}
        </button>
      </div>

      <div className="scoreboard">
        <div className="score-field">
          <span>Stage</span>
          <strong>{currentStage}</strong>
          <small>of {roomData.stages.length}</small>
        </div>
        <div className="score-field">
          <span>Score</span>
          <strong>{totalScore}</strong>
        </div>
        <div className="score-field">
          <span>Hints Used</span>
          <strong>{showHint ? currentHintIndex + 1 : 0}</strong>
        </div>
      </div>

      <div className="stage-content">
        <div className="story-section">
          <h2>{stageData.title}</h2>
          <p className="story-text">{stageData.story}</p>
          <div className="objective">
            <strong>Objective:</strong> {stageData.description}
          </div>
          {stageData.database_info && (
            <div className="database-info-box">
              <pre>{stageData.database_info}</pre>
            </div>
          )}

          <div className="hints-section">
            <button 
              className="hint-button cta-button"
              onClick={showNextHint}
              disabled={showHint && currentHintIndex >= stageData.hints.length - 1}
            >
              💡 Show Hint ({Math.min(currentHintIndex + 1, stageData.hints.length)}/{stageData.hints.length})
            </button>
            {showHint && (
              <div className="hint-box">
                <p>{stageData.hints[currentHintIndex]}</p>
              </div>
            )}
          </div>
        </div>

        <div className="editor-section">
          <SQLEditor 
            roomId="football"
            onQuerySuccess={handleQuerySuccess}
          />
          
          {validationError && (
            <div className="validation-error">
              <strong>❌ Not quite right!</strong>
              <p>{validationError}</p>
            </div>
          )}
        </div>

        {stageComplete && (
          <div className="stage-complete">
            <h3>🎉 Stage Complete!</h3>
            <p>You earned {100 - (currentHintIndex * 20)} points!</p>
            {currentStage < roomData.stages.length ? (
              <button className="next-stage-button cta-button" onClick={nextStage}>
                Continue to Next Stage →
              </button>
            ) : (
              <div className="room-complete">
                <h2>🏆 Room Complete!</h2>
                <p>Total Score: {totalScore + (100 - currentHintIndex * 20)}</p>
                <button className="cta-button" onClick={() => window.location.reload()}>
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {crowdSound && (
        <audio className="crowd-audio" autoPlay loop>
          <source src="/audio/stadium-ambience.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(currentStage / roomData.stages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default FootballRoom;