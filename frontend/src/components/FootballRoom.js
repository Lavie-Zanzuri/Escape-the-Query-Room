import React, { useState, useEffect } from 'react';
import SQLEditor from './SQLEditor';

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
  
  const [stageStartTime, setStageStartTime] = useState(null);
  const [stageElapsedTime, setStageElapsedTime] = useState(0);
  const [stageTimes, setStageTimes] = useState([]);

  useEffect(() => {
    loadRoomData();
  }, []);

  useEffect(() => {
    if (roomData) {
      loadStageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, roomData]);

  useEffect(() => {
    let interval;
    if (stageStartTime && !stageComplete) {
      interval = setInterval(() => {
        setStageElapsedTime(Math.floor((Date.now() - stageStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stageStartTime, stageComplete]);

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
      
      setStageStartTime(Date.now());
      setStageElapsedTime(0);
    } catch (error) {
      console.error('Error loading stage data:', error);
    }
  };

  const handleQuerySuccess = async (result) => {
    if (result.success && result.row_count > 0 && !stageComplete) {
      try {
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
          const finalTime = stageElapsedTime;
          const timeBonus = calculateTimeBonus(finalTime);
          const hintPenalty = currentHintIndex * 20;
          const stageScore = Math.max(0, timeBonus - hintPenalty);
          
          setStageTimes(prev => [...prev, {
            stage: currentStage,
            time: finalTime,
            score: stageScore
          }]);
          
          setStageComplete(true);
          setValidationError(null);
          setTotalScore((prev) => prev + stageScore);
        } else {
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

  const calculateTimeBonus = (seconds) => {
    if (seconds <= 30) return 100;
    const penalty = Math.floor((seconds - 30) / 2);
    return Math.max(20, 100 - penalty);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚽</div>
          <div className="text-white text-xl font-bold">Loading Stadium...</div>
        </div>
      </div>
    );
  }

  if (!roomData || !stageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-rose-900">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Error loading room data</h2>
          <button 
            onClick={loadRoomData}
            className="px-6 py-3 bg-white text-red-900 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 relative overflow-hidden">
      {/* Stadium Atmosphere Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 100px)'
        }} />
      </div>
      
      {/* Floodlights Effect */}
      <div className="fixed top-0 left-0 right-0 h-96 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.2), transparent)'
      }} />
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto pt-24">
        {/* Header with Glass Effect */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                ⚽
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">{roomData.name}</h1>
                <p className="text-green-100 text-sm">UEFA Database Infiltration</p>
              </div>
            </div>
            
            <button
              onClick={() => setCrowdSound(!crowdSound)}
              className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                crowdSound 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50' 
                  : 'bg-white/20 text-white border border-white/30'
              }`}
            >
              {crowdSound ? '🔊 Crowd On' : '🔇 Crowd Off'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-sm border border-blue-300/30 rounded-xl p-4">
              <div className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Stage</div>
              <div className="text-white text-3xl font-black">{currentStage}</div>
              <div className="text-blue-200 text-xs">of {roomData.stages.length}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/30 backdrop-blur-sm border border-purple-300/30 rounded-xl p-4">
              <div className="text-purple-100 text-xs font-semibold uppercase tracking-wider mb-1">⏱️ Stage Time</div>
              <div className={`text-white text-3xl font-black ${stageElapsedTime > 60 ? 'animate-pulse' : ''}`}>
                {formatTime(stageElapsedTime)}
              </div>
              <div className="text-purple-200 text-xs">+{calculateTimeBonus(stageElapsedTime)} pts</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/30 to-orange-600/30 backdrop-blur-sm border border-orange-300/30 rounded-xl p-4">
              <div className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">🏁 Total Time</div>
              <div className="text-white text-3xl font-black">
                {formatTime(
                  stageTimes.reduce((sum, st) => sum + st.time, 0) + 
                  (stageComplete ? 0 : stageElapsedTime)
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 backdrop-blur-sm border border-yellow-300/30 rounded-xl p-4">
              <div className="text-yellow-100 text-xs font-semibold uppercase tracking-wider mb-1">Score</div>
              <div className="text-white text-3xl font-black">{totalScore}</div>
            </div>

            <div className="bg-gradient-to-br from-pink-500/30 to-pink-600/30 backdrop-blur-sm border border-pink-300/30 rounded-xl p-4">
              <div className="text-pink-100 text-xs font-semibold uppercase tracking-wider mb-1">💡 Hints</div>
              <div className="text-white text-3xl font-black">{showHint ? currentHintIndex + 1 : 0}</div>
              <div className="text-pink-200 text-xs">-{currentHintIndex * 20} pts</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Story Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Brief Card */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-900/80 to-emerald-900/80 border border-green-400/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-2xl">
                  🎯
                </div>
                <h2 className="text-2xl font-black text-white">{stageData.title}</h2>
              </div>
              
              <p className="text-green-50 leading-relaxed mb-4">{stageData.story}</p>
              
              <div className="bg-yellow-500/20 border-l-4 border-yellow-400 rounded-r-lg p-4">
                <div className="font-bold text-yellow-100 mb-1 flex items-center gap-2">
                  <span>⚡</span> OBJECTIVE
                </div>
                <p className="text-yellow-50 text-sm">{stageData.description}</p>
              </div>
            </div>

            {/* Database Schema Card */}
            {stageData.database_info && (
              <div className="backdrop-blur-xl bg-black/40 border border-green-400/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-xl">
                    💾
                  </div>
                  <h3 className="text-lg font-bold text-cyan-300">DATABASE SCHEMA</h3>
                </div>
                <pre className="text-green-400 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {stageData.database_info}
                </pre>
              </div>
            )}

            {/* Hints Section */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-amber-900/60 to-orange-900/60 border border-amber-400/30 rounded-2xl p-6 shadow-2xl">
              <button
                onClick={showNextHint}
                disabled={showHint && currentHintIndex >= stageData.hints.length - 1}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
              >
                💡 Show Hint ({Math.min(currentHintIndex + 1, stageData.hints.length)}/{stageData.hints.length})
              </button>
              
              {showHint && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-400/50 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <p className="text-yellow-50 leading-relaxed flex-1">{stageData.hints[currentHintIndex]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SQL Editor Section - 3 columns */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              <SQLEditor 
                roomId="football"
                onQuerySuccess={handleQuerySuccess}
              />
              
              {validationError && (
                <div className="p-6 pt-0">
                  <div className="bg-red-50 border-red-300 border-2 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">❌</span>
                      <div className="flex-1">
                        <div className="font-bold text-red-900 mb-1">Not quite right!</div>
                        <div className="text-red-700">
                          {validationError}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stage Complete Modal */}
        {stageComplete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 border-4 border-green-400 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-zoomIn">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4">🎉</div>
                <h3 className="text-4xl font-black text-white mb-2">STAGE COMPLETE!</h3>
                <div className="text-green-300 text-lg">Excellent work, investigator!</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4 border border-green-400/30">
                  <div className="text-green-300 text-sm mb-1">⏱️ Time</div>
                  <div className="text-white text-2xl font-bold">{formatTime(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-green-400/30">
                  <div className="text-green-300 text-sm mb-1">⚡ Time Bonus</div>
                  <div className="text-yellow-400 text-2xl font-bold">+{calculateTimeBonus(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-green-400/30">
                  <div className="text-green-300 text-sm mb-1">💡 Hints Used</div>
                  <div className="text-orange-400 text-2xl font-bold">-{currentHintIndex * 20}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl p-4 border-2 border-yellow-300">
                  <div className="text-yellow-900 text-sm font-bold mb-1">🏆 STAGE SCORE</div>
                  <div className="text-white text-3xl font-black">{Math.max(0, calculateTimeBonus(stageElapsedTime) - (currentHintIndex * 20))}</div>
                </div>
              </div>

              {currentStage < roomData.stages.length ? (
                <button
                  onClick={nextStage}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black text-xl py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  Continue to Next Stage →
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-6xl mb-3">🏆</div>
                    <h2 className="text-3xl font-black text-yellow-400 mb-2">MISSION COMPLETE!</h2>
                    <p className="text-green-200">You've exposed the corruption!</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/40 rounded-xl p-4 text-center">
                      <div className="text-green-300 text-sm mb-1">Total Score</div>
                      <div className="text-white text-2xl font-black">{totalScore}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 text-center">
                      <div className="text-green-300 text-sm mb-1">Total Time</div>
                      <div className="text-white text-2xl font-black">
                        {formatTime(stageTimes.reduce((sum, st) => sum + st.time, 0))}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 text-center">
                      <div className="text-green-300 text-sm mb-1">Avg/Stage</div>
                      <div className="text-white text-2xl font-black">
                        {formatTime(Math.floor(stageTimes.reduce((sum, st) => sum + st.time, 0) / stageTimes.length))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6 border border-green-400/30">
                    <h3 className="text-green-300 font-bold mb-4 text-center">STAGE BREAKDOWN</h3>
                    <div className="space-y-2">
                      {stageTimes.map((stageTime, index) => (
                        <div key={index} className="flex justify-between items-center bg-green-900/30 rounded-lg p-3">
                          <span className="text-white font-bold">Stage {stageTime.stage}</span>
                          <span className="text-green-300">{formatTime(stageTime.time)}</span>
                          <span className="text-yellow-400 font-bold">{stageTime.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-black text-xl py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-black/50">
        <div 
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
          style={{ width: `${(currentStage / roomData.stages.length) * 100}%` }}
        />
      </div>

      {crowdSound && (
        <audio className="hidden" autoPlay loop>
          <source src="/audio/converted_audio.mp3" type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
};

export default FootballRoom;