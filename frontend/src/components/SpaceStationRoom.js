import React, { useState, useEffect } from 'react';
import SQLEditor from './SQLEditor';
import DatabaseViewer from './DatabaseViewer';

const SpaceStationRoom = ({ onBack }) => {
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

  const [aiHint, setAiHint] = useState(null);
  const [aiHintsUsed, setAiHintsUsed] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [isLoadingAiHint, setIsLoadingAiHint] = useState(false);
  const MAX_AI_HINTS = 1;

  const missionSuccessSound = new Audio('/audio/jackpot.mp3');

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
      const response = await fetch('http://localhost:5000/api/rooms/space');
      const data = await response.json();
      setRoomData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading space room data:', error);
      setLoading(false);
    }
  };

  const loadStageData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/space/stage/${currentStage}`);
      const data = await response.json();
      setStageData(data);
      setStageComplete(false);
      setShowHint(false);
      setCurrentHintIndex(-1);
      setHintsUsedInStage(0);
      setValidationError(null);
      setAiHint(null);

      setStageStartTime(Date.now());
      setStageElapsedTime(0);
    } catch (error) {
      console.error('Error loading space stage data:', error);
    }
  };

  const handleQuerySuccess = async (result) => {
    if (result.success && result.row_count > 0 && !stageComplete) {
      setLastQuery(result.query || '');
      try {
        const response = await fetch(`http://localhost:5000/api/validate-query/space/${currentStage}`, {
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
          setTotalScore(prev => prev + stageScore);

          missionSuccessSound.currentTime = 0;
          missionSuccessSound.volume = 0.5;
          missionSuccessSound.play().catch(err => console.log('Audio play failed:', err));
        } else {
          setValidationError(validation.message || 'Telemetry mismatch. Recheck the query.');
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidationError('Error validating your query. Please try again.');
      }
    } else if (result.success && result.row_count === 0) {
      setValidationError('No row returned. Verify your filters and try again.');
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
      setValidationError(`⚠️ You can only use ${MAX_HINTS_PER_STAGE} hints per stage.`);
      return;
    }

    if (totalHintsUsed >= MAX_HINTS_TOTAL) {
      setValidationError(`⚠️ You've reached the maximum of ${MAX_HINTS_TOTAL} hints for the mission.`);
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

  const getAiHint = async () => {
    if (aiHintsUsed >= MAX_AI_HINTS) {
      setValidationError(`⚠️ You can only use ${MAX_AI_HINTS} AI hint per game!`);
      return;
    }

    setIsLoadingAiHint(true);
    setValidationError(null);

    const allStageHints = stageData?.hints || [];

    try {
      const response = await fetch(`http://localhost:5000/api/ai-hint/space/${currentStage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_query: lastQuery,
          error: validationError || 'No error',
          existing_hints: allStageHints
        })
      });

      const data = await response.json();

      if (data.hint) {
        setAiHint(data.hint);
        setAiHintsUsed(prev => prev + 1);
      } else if (data.error) {
        setValidationError(data.error);
      }
    } catch (error) {
      console.error('AI hint error:', error);
      setValidationError('Error generating AI hint. Please try again later.');
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  const totalMissionSeconds = stageTimes.reduce((sum, entry) => sum + entry.time, 0) + (stageComplete ? 0 : stageElapsedTime);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🛰️</div>
          <div className="text-sky-300 text-xl font-bold">Connecting to Helios telemetry...</div>
        </div>
      </div>
    );
  }

  if (!roomData || !stageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Error loading space station data</h2>
          <button
            onClick={loadRoomData}
            className="px-6 py-3 bg-sky-500 text-black rounded-lg font-bold hover:bg-sky-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source src="/videos/Generated%20File%20October%2009,%202025%20-%205_08PM.mp4" type="video/mp4" />
      </video>

      {/* COSMIC BACKGROUND */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-black to-slate-900 opacity-20 z-0" />
      <div className="fixed inset-0 pointer-events-none z-0" id="stars-layer" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)] pointer-events-none z-0" />

      <div className="relative z-10 p-6 max-w-7xl mx-auto pt-24">
        {/* MISSION HEADER */}
        <div className="backdrop-blur-2xl bg-gradient-to-r from-indigo-900/80 via-black/80 to-sky-900/80 border-4 border-sky-500/80 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl" style={{
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.5), inset 0 0 40px rgba(37, 99, 235, 0.2)'
          }} />

          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(125,211,252,0.25) 12px, rgba(125,211,252,0.25) 24px)'
          }} />

          <div className="relative flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-sky-300 via-sky-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-2xl animate-pulse" style={{
                  boxShadow: '0 0 60px rgba(125, 211, 252, 0.9), 0 0 80px rgba(37, 99, 235, 0.4)'
                }}>
                  🚀
                </div>
                <div className="absolute inset-0 border-4 border-sky-300 rounded-full animate-spin" style={{
                  animationDuration: '5s',
                  opacity: 0.4
                }} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200 tracking-tight drop-shadow-lg" style={{
                  textShadow: '0 0 30px rgba(125, 211, 252, 0.8), 0 4px 10px rgba(0,0,0,0.6)',
                  fontFamily: "'Arial Black', Arial, sans-serif"
                }}>
                  {roomData.name}
                </h1>
                <p className="text-sky-300 text-sm font-bold uppercase tracking-wider">
                  🛰️ RESTORE SYSTEMS • SAVE THE CREW
                </p>
              </div>
            </div>
          </div>

          {/* SPACE MISSION STATUS */}
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-indigo-500/40 rounded-2xl p-5 overflow-hidden shadow-2xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-indigo-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-indigo-300 rounded-full animate-pulse" />
                  STAGE
                </div>
                <div className="text-sky-300 text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 25px rgba(125, 211, 252, 0.8)'
                }}>{currentStage}</div>
                <div className="text-indigo-200 text-xs font-bold">OF {roomData.stages.length}</div>
              </div>
            </div>

            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-sky-500/40 rounded-2xl p-5 overflow-hidden shadow-2xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 to-sky-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-sky-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-sky-300 rounded-full animate-pulse" />
                  ⏱️ STAGE
                </div>
                <div className={`text-sky-300 text-4xl font-black tabular-nums ${stageElapsedTime > 60 ? 'animate-pulse text-rose-300' : ''}`} style={{
                  textShadow: stageElapsedTime > 60 ? '0 0 20px rgba(244, 114, 182, 0.8)' : '0 0 20px rgba(125, 211, 252, 0.8)'
                }}>
                  {formatTime(stageElapsedTime)}
                </div>
                <div className="text-sky-200 text-xs font-bold">+{calculateTimeBonus(stageElapsedTime)} PTS</div>
              </div>
            </div>

            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-blue-500/40 rounded-2xl p-5 overflow-hidden shadow-2xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                  🏁 TOTAL
                </div>
                <div className="text-sky-200 text-4xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(125, 211, 252, 0.8)'
                }}>{formatTime(totalMissionSeconds)}</div>
                <div className="text-blue-200 text-xs font-bold">Mission Runtime</div>
              </div>
            </div>

            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-cyan-500/40 rounded-2xl p-5 overflow-hidden shadow-2xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-cyan-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-cyan-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-cyan-300 rounded-full animate-pulse" />
                  🎯 SCORE
                </div>
                <div className="text-cyan-200 text-4xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(103, 232, 249, 0.8)'
                }}>{totalScore}</div>
                <div className="text-cyan-200 text-xs font-bold">Mission Points</div>
              </div>
            </div>

            <div className="relative bg-black/80 backdrop-blur-sm border-4 border-purple-500/40 rounded-2xl p-5 overflow-hidden shadow-2xl hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-fuchsia-900/30 animate-pulse" />
              <div className="relative">
                <div className="text-purple-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-purple-300 rounded-full animate-pulse" />
                  💡 HINTS
                </div>
                <div className="text-purple-200 text-4xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(192, 132, 252, 0.8)'
                }}>{hintsUsedInStage}</div>
                <div className="text-purple-200 text-xs font-bold">Stage • Total {totalHintsUsed}/{MAX_HINTS_TOTAL}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-6">
          {/* Database Viewer Sidebar */}
          <DatabaseViewer roomId="space" />

          {/* Main Content */}
          <div className="flex-1 grid lg:grid-cols-5 gap-6">
            {/* Story Section - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Brief Card */}
              <div className="backdrop-blur-2xl bg-gradient-to-br from-indigo-900/90 to-black/90 border-2 border-indigo-500/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent animate-pulse" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl animate-pulse" style={{
                      boxShadow: '0 0 30px rgba(96, 165, 250, 0.8)'
                    }}>
                      🛰️
                    </div>
                    <h2 className="text-3xl font-black text-sky-200 drop-shadow-lg">{stageData.title}</h2>
                  </div>

                  <p className="text-slate-100 text-lg leading-relaxed mb-6">{stageData.story}</p>

                  <div className="bg-sky-500/20 border-l-8 border-sky-400 rounded-r-2xl p-6 shadow-xl" style={{
                    boxShadow: '0 0 25px rgba(96, 165, 250, 0.3)'
                  }}>
                    <div className="font-black text-sky-100 text-lg mb-2 flex items-center gap-2">
                      <span className="text-2xl">🧭</span> MISSION OBJECTIVE
                    </div>
                    <p className="text-sky-50 text-base">{stageData.description}</p>
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
                        ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-sky-600 hover:scale-105 text-white'
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                    style={{
                      boxShadow: canUseHint() ? '0 0 30px rgba(192, 132, 252, 0.6)' : 'none'
                    }}
                  >
                    💡 REQUEST HINT ({hintsUsedInStage}/{MAX_HINTS_PER_STAGE})
                    <div className="text-xs mt-1">
                      {totalHintsUsed}/{MAX_HINTS_TOTAL} mission hints used
                    </div>
                  </button>

                {showHint && currentHintIndex >= 0 && (
                  <div className="mt-6 bg-purple-500/20 border-2 border-purple-400/60 rounded-2xl p-6 animate-fadeIn shadow-xl" style={{
                    boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)'
                  }}>
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">🧠</span>
                      <p className="text-purple-50 text-lg leading-relaxed flex-1 font-semibold">{stageData.hints[currentHintIndex]}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={getAiHint}
                  disabled={aiHintsUsed >= MAX_AI_HINTS || isLoadingAiHint}
                  className={`w-full mt-6 font-black text-lg py-5 px-8 rounded-2xl transition-all transform shadow-2xl ${
                    aiHintsUsed < MAX_AI_HINTS && !isLoadingAiHint
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:scale-105 text-white'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: aiHintsUsed < MAX_AI_HINTS && !isLoadingAiHint ? '0 0 30px rgba(129, 140, 248, 0.6)' : 'none'
                  }}
                >
                  {isLoadingAiHint ? '🤖 Requesting AI hint…' : `🤖 AI STRATEGIC HINT (${aiHintsUsed}/${MAX_AI_HINTS} used)`}
                  <div className="text-xs mt-1">
                    Uses remaining this game: {MAX_AI_HINTS - aiHintsUsed}
                  </div>
                </button>

                {aiHint && (
                  <div className="mt-6 bg-indigo-500/20 border-2 border-indigo-400/60 rounded-2xl p-6 animate-fadeIn shadow-xl" style={{
                    boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)'
                  }}>
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">🤖</span>
                      <p className="text-indigo-50 text-lg leading-relaxed flex-1 font-semibold">{aiHint}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* SQL Editor Section - 3 columns */}
            <div className="lg:col-span-3">
              <div className="backdrop-blur-2xl bg-white/95 rounded-3xl shadow-2xl overflow-hidden border-4 border-sky-400 hover:scale-[1.01] transition-transform">
                <SQLEditor
                  roomId="space"
                  onQuerySuccess={handleQuerySuccess}
                  hideDbInfo={true}
                />

                {validationError && (
                  <div className="p-6 pt-0">
                    <div className="bg-rose-50 border-4 border-rose-500 rounded-2xl p-6 shadow-xl animate-pulse">
                      <div className="flex items-start gap-4">
                        <span className="text-5xl">⚠️</span>
                        <div className="flex-1">
                          <div className="font-black text-rose-900 text-xl mb-2">MISSION ALERT</div>
                          <div className="text-rose-700 text-lg font-semibold">
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
            <div className="bg-gradient-to-br from-indigo-900 via-black to-sky-900 border-8 border-sky-400 rounded-3xl p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden" style={{
              boxShadow: '0 0 80px rgba(56, 189, 248, 0.8), 0 20px 60px rgba(14, 165, 233, 0.4)'
            }}>
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
                    {['🚀', '🛰️', '✨', '🌌', '🔧'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>

              <div className="relative text-center mb-8">
                <div className="text-8xl mb-6 animate-bounce">🛰️</div>
                <h3 className="text-5xl font-black text-sky-200 mb-4 drop-shadow-2xl" style={{
                  textShadow: '0 0 40px rgba(125, 211, 252, 1), 0 4px 20px rgba(14, 116, 144, 0.8)'
                }}>MISSION SUCCESS</h3>
                <div className="text-sky-300 text-2xl font-bold animate-pulse">Telemetry verified. Systems stabilising.</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-sky-400/50 shadow-2xl">
                  <div className="text-sky-200 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-sky-300 rounded-full animate-pulse" />
                    ⏱️ RESPONSE TIME
                  </div>
                  <div className="text-sky-200 text-4xl font-black tabular-nums">{formatTime(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-sky-400/50 shadow-2xl">
                  <div className="text-sky-200 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-sky-300 rounded-full animate-pulse" />
                    ⚡ TIME BONUS
                  </div>
                  <div className="text-sky-200 text-4xl font-black tabular-nums">+{calculateTimeBonus(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/60 rounded-2xl p-6 border-4 border-purple-400/50 shadow-2xl">
                  <div className="text-purple-200 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-purple-300 rounded-full animate-pulse" />
                    💡 HINT PENALTY
                  </div>
                  <div className="text-purple-200 text-4xl font-black tabular-nums">-{hintsUsedInStage * 20}</div>
                </div>
                <div className="bg-gradient-to-br from-sky-400 to-indigo-600 rounded-2xl p-6 border-4 border-sky-200 shadow-2xl" style={{
                  boxShadow: '0 0 40px rgba(125, 211, 252, 0.6)'
                }}>
                  <div className="text-indigo-900 text-sm font-black mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
                    🛰️ STAGE SCORE
                  </div>
                  <div className="text-white text-5xl font-black tabular-nums">{Math.max(0, calculateTimeBonus(stageElapsedTime) - hintsUsedInStage * 20)}</div>
                </div>
              </div>

              <div className="bg-black/60 rounded-2xl p-8 border-4 border-sky-400/50 shadow-2xl mb-6">
                <div className="grid grid-cols-2 gap-6 text-sky-200">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-sky-300">Mission Stage</div>
                    <div className="text-3xl font-black">{currentStage} / {roomData.stages.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-sky-300">Total Mission Points</div>
                    <div className="text-3xl font-black">{totalScore}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-sky-300">Hints Used (Stage)</div>
                    <div className="text-3xl font-black">{hintsUsedInStage}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-sky-300">Total Hints</div>
                    <div className="text-3xl font-black">{totalHintsUsed}</div>
                  </div>
                </div>
              </div>

              {currentStage < roomData.stages.length ? (
                <button
                  onClick={() => {
                    setStageComplete(false);
                    nextStage();
                  }}
                  className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-600 text-white font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl border-4 border-sky-200"
                  style={{
                    boxShadow: '0 0 40px rgba(129, 140, 248, 0.6)'
                  }}
                >
                  Continue Mission →
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="bg-black/60 rounded-2xl p-6 border-4 border-indigo-500/50 shadow-2xl">
                    <h3 className="text-sky-200 font-black text-2xl mb-6 text-center flex items-center justify-center gap-2">
                      <span>📊</span> Mission Debrief
                    </h3>
                    <div className="space-y-4">
                      {stageTimes.map((stageTime, index) => (
                        <div key={index} className="flex justify-between items-center bg-indigo-900/40 rounded-xl p-5 border-2 border-indigo-500/30 hover:bg-indigo-900/60 transition-colors">
                          <span className="text-sky-300 font-black text-xl">🛰️ Stage {stageTime.stage}</span>
                          <span className="text-sky-200 font-bold text-lg tabular-nums">{formatTime(stageTime.time)}</span>
                          <span className="text-purple-300 font-bold text-lg">💡 {stageTime.hintsUsed} hints</span>
                          <span className="text-sky-300 font-black text-xl">{stageTime.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-600 text-white font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl border-4 border-sky-200"
                    style={{
                      boxShadow: '0 0 40px rgba(129, 140, 248, 0.6)'
                    }}
                  >
                    🔄 Relaunch Mission
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ANIMATED PROGRESS BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-4 bg-black/90 border-t-4 border-sky-500/40">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 via-sky-400 to-indigo-600 transition-all duration-500 relative shadow-2xl"
          style={{
            width: `${(currentStage / roomData.stages.length) * 100}%`,
            boxShadow: '0 0 30px rgba(125, 211, 252, 0.8)'
          }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-2xl animate-bounce">
            🚀
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
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        #stars-layer {
          background-image: radial-gradient(2px 2px at 20px 30px, rgba(148, 163, 184, 0.7), transparent),
                            radial-gradient(1.5px 1.5px at 100px 80px, rgba(56, 189, 248, 0.6), transparent),
                            radial-gradient(1.5px 1.5px at 200px 150px, rgba(165, 180, 252, 0.6), transparent);
          background-size: 200px 200px;
          animation: twinkle 6s linear infinite;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default SpaceStationRoom;
