import React, { useState, useEffect } from 'react';
import SQLEditor from './SQLEditor';
import DatabaseViewer from './DatabaseViewer';

const CasinoRoom = ({ onBack }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [roomData, setRoomData] = useState(null);
  const [stageData, setStageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [hintsUsedInStage, setHintsUsedInStage] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [validationError, setValidationError] = useState(null);
  
  const [stageStartTime, setStageStartTime] = useState(null);
  const [stageElapsedTime, setStageElapsedTime] = useState(0);
  const [stageTimes, setStageTimes] = useState([]);

  const MAX_HINTS_PER_STAGE = 2;
  const MAX_HINTS_TOTAL = 3;

  // Jackpot Sound Effect
  const jackpotSound = new Audio('/audio/jackpot.mp3');

  useEffect(() => {
    loadRoomData();
  }, []);

  useEffect(() => {
    if (roomData) {
      loadStageData();
    }
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
      const response = await fetch('http://localhost:5000/api/rooms/casino');
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
      const response = await fetch(`http://localhost:5000/api/rooms/casino/stage/${currentStage}`);
      const data = await response.json();
      setStageData(data);
      setStageComplete(false);
      setShowHint(false);
      setCurrentHintIndex(-1);
      setHintsUsedInStage(0);
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
        const response = await fetch(`http://localhost:5000/api/validate-query/casino/${currentStage}`, {
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
          const hintPenalty = hintsUsedInStage * 20;
          const stageScore = Math.max(0, timeBonus - hintPenalty);
          
          setStageTimes(prev => [...prev, {
            stage: currentStage,
            time: finalTime,
            score: stageScore,
            hintsUsed: hintsUsedInStage
          }]);
          
          setStageComplete(true);
          setValidationError(null);
          setTotalScore((prev) => prev + stageScore);

          // Play JACKPOT SOUND
          jackpotSound.currentTime = 0;
          jackpotSound.volume = 0.7;
          jackpotSound.play().catch(err => console.log('Audio play failed:', err));
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
    if (hintsUsedInStage >= MAX_HINTS_PER_STAGE) {
      setValidationError(`⚠️ You can only use ${MAX_HINTS_PER_STAGE} hints per stage!`);
      return;
    }
    
    if (totalHintsUsed >= MAX_HINTS_TOTAL) {
      setValidationError(`⚠️ You've reached the maximum of ${MAX_HINTS_TOTAL} hints for the entire game!`);
      return;
    }

    if (stageData && currentHintIndex < stageData.hints.length - 1) {
      const nextIndex = currentHintIndex + 1;
      setCurrentHintIndex(nextIndex);
      setHintsUsedInStage(prev => prev + 1);
      setTotalHintsUsed(prev => prev + 1);
      setShowHint(true);
      setValidationError(null);
    }
  };

  const canUseHint = () => {
    return hintsUsedInStage < MAX_HINTS_PER_STAGE && 
           totalHintsUsed < MAX_HINTS_TOTAL && 
           stageData && 
           currentHintIndex < stageData.hints.length - 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎰</div>
          <div className="text-yellow-400 text-xl font-bold">Loading Casino...</div>
        </div>
      </div>
    );
  }

  if (!roomData || !stageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Error loading room data</h2>
          <button 
            onClick={loadRoomData}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #1a0000 0%, #4a0000 25%, #000000 50%, #4a0000 75%, #1a0000 100%)'
    }}>
      {/* VEGAS LIGHTS BACKGROUND */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div style={{
          background: `repeating-linear-gradient(
            0deg,
            #ff0000 0px,
            #ff0000 4px,
            transparent 4px,
            transparent 8px
          )`
        }} className="w-full h-full animate-pulse" />
      </div>

      {/* FLOATING CARDS */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
        <div className="absolute top-40 right-20 text-5xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>💎</div>
        <div className="absolute bottom-32 left-1/4 text-7xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>🎰</div>
        <div className="absolute top-1/3 right-1/3 text-4xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>💰</div>
      </div>

      {/* SPARKLE PARTICLES */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#FFD700' : '#FF0000',
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
              boxShadow: `0 0 ${10 + Math.random() * 10}px ${i % 2 === 0 ? '#FFD700' : '#FF0000'}`,
              opacity: 0.7
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto pt-24">
        {/* CASINO HEADER */}
        <div className="backdrop-blur-2xl bg-gradient-to-r from-red-900/90 via-black/90 to-red-900/90 border-4 border-yellow-500 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl animate-pulse" style={{
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 40px rgba(255, 0, 0, 0.2)'
          }} />
          
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,215,0,0.3) 10px, rgba(255,215,0,0.3) 20px)'
          }} />

          <div className="relative flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-4xl shadow-2xl animate-pulse" style={{
                  boxShadow: '0 0 50px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.5)'
                }}>
                  🎰
                </div>
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin" style={{
                  animationDuration: '4s',
                  opacity: 0.4
                }} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 tracking-tight drop-shadow-lg" style={{
                  textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 4px 10px rgba(0,0,0,0.5)',
                  fontFamily: "'Arial Black', Arial, sans-serif"
                }}>
                  {roomData.name}
                </h1>
                <p className="text-red-400 text-sm font-bold uppercase tracking-wider animate-pulse">
                  💰 HACK THE SYSTEM • EXPOSE THE FRAUD
                </p>
              </div>
            </div>
          </div>

          {/* DIGITAL SCOREBOARD */}
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {/* Stage Counter */}
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-red-500/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-red-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-red-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  STAGE
                </div>
                <div className="text-yellow-400 text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                }}>{currentStage}</div>
                <div className="text-red-400 text-xs font-bold">OF {roomData.stages.length}</div>
              </div>
            </div>

            {/* Stage Timer */}
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-yellow-500/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 to-yellow-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-yellow-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  ⏱️ STAGE
                </div>
                <div className={`text-yellow-400 text-4xl font-black tabular-nums ${stageElapsedTime > 60 ? 'animate-pulse text-red-400' : ''}`} style={{
                  textShadow: stageElapsedTime > 60 ? '0 0 20px rgba(239, 68, 68, 0.8)' : '0 0 20px rgba(255, 215, 0, 0.8)'
                }}>
                  {formatTime(stageElapsedTime)}
                </div>
                <div className="text-yellow-500 text-xs font-bold">+{calculateTimeBonus(stageElapsedTime)} PTS</div>
              </div>
            </div>

            {/* Total Time */}
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-orange-500/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 to-orange-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-orange-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  🏁 TOTAL
                </div>
                <div className="text-yellow-400 text-4xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                }}>
                  {formatTime(
                    stageTimes.reduce((sum, st) => sum + st.time, 0) + 
                    (stageComplete ? 0 : stageElapsedTime)
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-yellow-500/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 to-yellow-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-yellow-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  💰 SCORE
                </div>
                <div className="text-yellow-400 text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                }}>{totalScore}</div>
              </div>
            </div>

            {/* Hints */}
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-purple-500/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-purple-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-purple-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  💡 HINTS
                </div>
                <div className="text-yellow-400 text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                }}>{hintsUsedInStage}</div>
                <div className="text-purple-400 text-xs font-bold">
                  {totalHintsUsed}/{MAX_HINTS_TOTAL} TOTAL | -{hintsUsedInStage * 20} PTS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-6">
          {/* Database Viewer Sidebar */}
          <DatabaseViewer roomId="casino" />

          {/* Main Content */}
          <div className="flex-1 grid lg:grid-cols-5 gap-6">
          {/* Story Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Brief Card */}
            <div className="backdrop-blur-2xl bg-gradient-to-br from-red-900/90 to-black/90 border-2 border-red-500/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent animate-pulse" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 via-red-600 to-red-800 rounded-2xl flex items-center justify-center text-3xl shadow-2xl animate-pulse" style={{
                    boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)'
                  }}>
                    🎯
                  </div>
                  <h2 className="text-3xl font-black text-yellow-400 drop-shadow-lg">{stageData.title}</h2>
                </div>
                
                <p className="text-red-50 text-lg leading-relaxed mb-6">{stageData.story}</p>
                
                <div className="bg-yellow-500/20 border-l-8 border-yellow-500 rounded-r-2xl p-6 shadow-xl" style={{
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
                }}>
                  <div className="font-black text-yellow-200 text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> HACK OBJECTIVE
                  </div>
                  <p className="text-yellow-50 text-base">{stageData.description}</p>
                </div>
              </div>
            </div>

            

            {/* Hints Section */}
            <div className="backdrop-blur-2xl bg-gradient-to-br from-purple-900/80 to-black/80 border-2 border-purple-500/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden hover:scale-[1.02] transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent animate-pulse" />
              <div className="relative">
                <button
                  onClick={showNextHint}
                  disabled={!canUseHint()}
                  className={`w-full font-black text-lg py-5 px-8 rounded-2xl transition-all transform shadow-2xl ${
                    canUseHint()
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 hover:scale-105 text-white'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: canUseHint() ? '0 0 30px rgba(168, 85, 247, 0.6)' : 'none'
                  }}
                >
                  💡 UNLOCK HINT ({hintsUsedInStage}/{MAX_HINTS_PER_STAGE} used)
                  <div className="text-xs mt-1">
                    {totalHintsUsed}/{MAX_HINTS_TOTAL} total game hints used
                  </div>
                </button>
                
                {showHint && currentHintIndex >= 0 && (
                  <div className="mt-6 bg-purple-500/20 border-2 border-purple-400/60 rounded-2xl p-6 animate-fadeIn shadow-xl" style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
                  }}>
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">💡</span>
                      <p className="text-purple-50 text-lg leading-relaxed flex-1 font-semibold">{stageData.hints[currentHintIndex]}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SQL Editor Section - 3 columns */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-2xl bg-white/98 rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-500 hover:scale-[1.01] transition-transform">
              <SQLEditor 
                roomId="casino"
                onQuerySuccess={handleQuerySuccess}
              />
              
              {validationError && (
                <div className="p-6 pt-0">
                  <div className="bg-red-50 border-red-500 border-4 rounded-2xl p-6 shadow-xl animate-pulse">
                    <div className="flex items-start gap-4">
                      <span className="text-5xl">❌</span>
                      <div className="flex-1">
                        <div className="font-black text-red-900 text-xl mb-2">ACCESS DENIED!</div>
                        <div className="text-red-700 text-lg font-semibold">
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
        </div>

        {/* Stage Complete Modal */}
        {stageComplete && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-red-900 via-black to-red-900 border-8 border-yellow-500 rounded-3xl p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden" style={{
              boxShadow: '0 0 80px rgba(255, 215, 0, 0.8), 0 20px 60px rgba(0, 0, 0, 0.7)'
            }}>
              {/* Celebration particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl animate-bounce"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${1 + Math.random() * 2}s`,
                      animationDelay: `${Math.random()}s`,
                      opacity: 0.8
                    }}
                  >
                    {['🎰', '💰', '💎', '✨', '🎊'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>

              <div className="relative text-center mb-8">
                <div className="text-9xl mb-6 animate-bounce">🎰</div>
                <h3 className="text-6xl font-black text-yellow-400 mb-4 drop-shadow-2xl" style={{
                  textShadow: '0 0 40px rgba(255, 215, 0, 1), 0 4px 20px rgba(0, 0, 0, 0.8)'
                }}>JACKPOT!</h3>
                <div className="text-red-400 text-2xl font-bold animate-pulse">💰 Stage Hacked Successfully!</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-yellow-500/50 shadow-2xl">
                  <div className="text-yellow-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                    ⏱️ TIME
                  </div>
                  <div className="text-yellow-400 text-4xl font-black tabular-nums">{formatTime(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-yellow-500/50 shadow-2xl">
                  <div className="text-yellow-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                    ⚡ TIME BONUS
                  </div>
                  <div className="text-yellow-400 text-4xl font-black tabular-nums">+{calculateTimeBonus(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-yellow-500/50 shadow-2xl">
                  <div className="text-yellow-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                    💡 HINTS USED
                  </div>
                  <div className="text-purple-400 text-4xl font-black tabular-nums">-{hintsUsedInStage * 20}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl p-6 border-4 border-yellow-300 shadow-2xl" style={{
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)'
                }}>
                  <div className="text-yellow-900 text-sm font-black mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
                    💰 STAGE SCORE
                  </div>
                  <div className="text-white text-5xl font-black tabular-nums drop-shadow-lg">{Math.max(0, calculateTimeBonus(stageElapsedTime) - (hintsUsedInStage * 20))}</div>
                </div>
              </div>

              {currentStage < roomData.stages.length ? (
                <button
                  onClick={nextStage}
                  className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-yellow-400 font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl border-4 border-yellow-500"
                  style={{
                    boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)'
                  }}
                >
                  ➡️ CONTINUE TO NEXT STAGE
                </button>
              ) : (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="text-8xl mb-4 animate-bounce">💰</div>
                    <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-2xl" style={{
                      textShadow: '0 0 40px rgba(255, 215, 0, 1)'
                    }}>CASINO HACKED!</h2>
                    <p className="text-red-300 text-xl font-bold">✅ Fraud Exposed! You Win Big!</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-black/70 rounded-2xl p-6 text-center border-4 border-yellow-500/50 shadow-2xl">
                      <div className="text-yellow-300 text-sm font-bold mb-2">💰 TOTAL SCORE</div>
                      <div className="text-yellow-400 text-4xl font-black tabular-nums">{totalScore}</div>
                    </div>
                    <div className="bg-black/70 rounded-2xl p-6 text-center border-4 border-yellow-500/50 shadow-2xl">
                      <div className="text-yellow-300 text-sm font-bold mb-2">⏱️ TOTAL TIME</div>
                      <div className="text-yellow-400 text-4xl font-black tabular-nums">
                        {formatTime(stageTimes.reduce((sum, st) => sum + st.time, 0))}
                      </div>
                    </div>
                    <div className="bg-black/70 rounded-2xl p-6 text-center border-4 border-yellow-500/50 shadow-2xl">
                      <div className="text-yellow-300 text-sm font-bold mb-2">💡 TOTAL HINTS</div>
                      <div className="text-yellow-400 text-4xl font-black tabular-nums">{totalHintsUsed}</div>
                    </div>
                  </div>

                  <div className="bg-black/60 rounded-2xl p-8 border-4 border-red-500/50 shadow-2xl">
                    <h3 className="text-red-400 font-black text-2xl mb-6 text-center flex items-center justify-center gap-2">
                      <span>📊</span> HEIST BREAKDOWN
                    </h3>
                    <div className="space-y-4">
                      {stageTimes.map((stageTime, index) => (
                        <div key={index} className="flex justify-between items-center bg-red-900/40 rounded-xl p-5 border-2 border-red-500/30 hover:bg-red-900/60 transition-colors">
                          <span className="text-yellow-400 font-black text-xl">🎰 Stage {stageTime.stage}</span>
                          <span className="text-yellow-300 font-bold text-lg tabular-nums">{formatTime(stageTime.time)}</span>
                          <span className="text-purple-400 font-bold text-lg">💡 {stageTime.hintsUsed} hints</span>
                          <span className="text-yellow-400 font-black text-xl">{stageTime.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl border-4 border-yellow-300"
                    style={{
                      boxShadow: '0 0 40px rgba(234, 179, 8, 0.8)'
                    }}
                  >
                    🔄 PLAY AGAIN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ANIMATED PROGRESS BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-4 bg-black/90 border-t-4 border-yellow-500/50">
        <div 
          className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 transition-all duration-500 relative shadow-2xl"
          style={{ 
            width: `${(currentStage / roomData.stages.length) * 100}%`,
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)'
          }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-2xl animate-bounce">
            💰
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CasinoRoom;