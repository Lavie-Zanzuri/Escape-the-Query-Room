import React, { useState, useEffect } from 'react';
import SQLEditor from './SQLEditor';
import DatabaseViewer from './DatabaseViewer';
import { Trophy, Target, Zap, Clock, Award, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

const FootballRoom = ({ onBack, username }) => {
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
  const [crowdSound, setCrowdSound] = useState(false);
  const [validationError, setValidationError] = useState(null);
  
  const [stageStartTime, setStageStartTime] = useState(null);
  const [stageElapsedTime, setStageElapsedTime] = useState(0);
  const [stageTimes, setStageTimes] = useState([]);

  const MAX_HINTS_PER_STAGE = 2;
  const MAX_HINTS_TOTAL = 3;

  // AI Hint states
  const [aiHint, setAiHint] = useState(null);
  const [aiHintsUsed, setAiHintsUsed] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [isLoadingAiHint, setIsLoadingAiHint] = useState(false);
  const MAX_AI_HINTS = 1;

  const goalSound = new Audio('/audio/goooooaall.mp3');
  const [runSubmitted, setRunSubmitted] = useState(false);

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
      const response = await fetch('http://localhost:5000/api/rooms/football');
      const data = await response.json();
      setRoomData(data);
      setLoading(false);
      setRunSubmitted(false);
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
      setCurrentHintIndex(-1);
      setHintsUsedInStage(0);
      setValidationError(null);
      setAiHint(null);
      
      setStageStartTime(Date.now());
      setStageElapsedTime(0);
    } catch (error) {
      console.error('Error loading stage data:', error);
    }
  };

  const handleQuerySuccess = async (result) => {
    if (result.success && result.row_count > 0 && !stageComplete) {
      setLastQuery(result.query || '');
      
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
          const hintPenalty = hintsUsedInStage * 20;
          const stageScore = Math.max(0, timeBonus - hintPenalty);

          if (roomData && currentStage === roomData.stages.length && !runSubmitted) {
            const finalScoreValue = totalScore + stageScore;
            const finalTotalTime = stageTimes.reduce((sum, st) => sum + st.time, 0) + finalTime;
            postRun(finalScoreValue, finalTotalTime);
          }

          setStageTimes(prev => [...prev, {
            stage: currentStage,
            time: finalTime,
            score: stageScore,
            hintsUsed: hintsUsedInStage
          }]);
          
          setStageComplete(true);
          setValidationError(null);
          setTotalScore((prev) => prev + stageScore);

          goalSound.currentTime = 0;
          goalSound.volume = 0.7;
          goalSound.play().catch(err => console.log('Audio play failed:', err));
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

  const getAiHint = async () => {
    if (aiHintsUsed >= MAX_AI_HINTS) {
      setValidationError(`⚠️ You can only use ${MAX_AI_HINTS} AI hint per game!`);
      return;
    }

    setIsLoadingAiHint(true);
    setValidationError(null);

    // שלח את כל הרמזים המובנים של השלב
    const allStageHints = stageData.hints || [];

    try {
      const response = await fetch(`http://localhost:5000/api/ai-hint/football/${currentStage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_query: lastQuery,
          error: validationError || 'No error',
          existing_hints: allStageHints
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAiHint(data.hint);
        setAiHintsUsed(prev => prev + 1);
        setTotalScore(prev => Math.max(0, prev - data.cost));
      } else {
        setValidationError(data.error || 'Failed to get AI hint. Try the regular hints!');
      }
    } catch (error) {
      console.error('AI Hint error:', error);
      setValidationError('Could not connect to AI service. Try the regular hints instead!');
    } finally {
      setIsLoadingAiHint(false);
    }
  };

  const postRun = async (finalScoreValue, finalTotalTime) => {
    if (!username || runSubmitted) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/leaderboard/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          room_id: 'football',
          total_time: finalTotalTime,
          score: finalScoreValue
        })
      });

      const data = await response.json();
      if (data && data.success) {
        setRunSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to record leaderboard run:', error);
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom, #0a1f0a 0%, #0d2b0d 30%, #1a4d1a 100%)'
    }}>
      {/* GRASS FIELD with STRIPES */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div style={{
          background: `repeating-linear-gradient(
            90deg,
            #1a5c1a 0px,
            #1a5c1a 80px,
            #0f4a0f 80px,
            #0f4a0f 160px
          )`
        }} className="w-full h-full" />
      </div>

      {/* FIELD LINES */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-full" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white" />
        <div className="absolute top-1/2 left-20 transform -translate-y-1/2 w-32 h-48 border-4 border-white" />
        <div className="absolute top-1/2 right-20 transform -translate-y-1/2 w-32 h-48 border-4 border-white" />
      </div>

      {/* STADIUM FLOODLIGHTS */}
      <div className="fixed top-0 left-0 right-0 h-96 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 opacity-30 animate-pulse" style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 60%)',
          animationDuration: '3s'
        }} />
        <div className="absolute top-0 right-1/4 w-96 h-96 opacity-25 animate-pulse" style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 60%)',
          animationDuration: '4s'
        }} />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-96 opacity-20" style={{
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.4) 0%, transparent 70%)'
        }} />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto pt-24">
        {/* STADIUM SCOREBOARD HEADER */}
        <div className="backdrop-blur-2xl bg-gradient-to-r from-green-900/90 via-emerald-800/90 to-green-900/90 border-4 border-yellow-400 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl animate-pulse" style={{
            boxShadow: '0 0 30px rgba(250, 204, 21, 0.5), inset 0 0 30px rgba(250, 204, 21, 0.1)'
          }} />
          
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.3) 2px, rgba(0,255,0,0.3) 4px)'
          }} />

          <div className="relative flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse" style={{
                  boxShadow: '0 0 40px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.4)'
                }}>
                  <Trophy className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin" style={{
                  animationDuration: '3s',
                  opacity: 0.3
                }} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg" style={{
                  textShadow: '0 0 20px rgba(250, 204, 21, 0.8), 0 4px 8px rgba(0,0,0,0.5)'
                }}>
                  {roomData.name}
                </h1>
                <p className="text-yellow-300 text-sm font-bold uppercase tracking-wider animate-pulse">
                  🏆 UEFA Database Infiltration Mission
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setCrowdSound(!crowdSound)}
              className={`px-8 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-110 shadow-2xl ${
                crowdSound 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border-2 border-gray-600'
              }`}
              style={{
                boxShadow: crowdSound ? '0 0 30px rgba(74, 222, 128, 0.6)' : '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              {crowdSound ? '🔊 CROWD ROARING' : '🔇 CROWD SILENT'}
            </button>
          </div>

          {/* DIGITAL SCOREBOARD */}
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="relative bg-black/60 backdrop-blur-sm border-4 border-blue-400/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-700/20 animate-pulse" />
              <div className="relative">
                <div className="text-blue-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  STAGE
                </div>
                <div className="text-white text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(96, 165, 250, 0.8)'
                }}>{currentStage}</div>
                <div className="text-blue-400 text-xs font-bold">OF {roomData.stages.length}</div>
              </div>
            </div>

            <div className="relative bg-black/60 backdrop-blur-sm border-4 border-purple-400/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-700/20 animate-pulse" />
              <div className="relative">
                <div className="text-purple-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  ⏱️ STAGE
                </div>
                <div className={`text-white text-4xl font-black tabular-nums ${stageElapsedTime > 60 ? 'animate-pulse text-red-400' : ''}`} style={{
                  textShadow: stageElapsedTime > 60 ? '0 0 20px rgba(239, 68, 68, 0.8)' : '0 0 20px rgba(192, 132, 252, 0.8)'
                }}>
                  {formatTime(stageElapsedTime)}
                </div>
                <div className="text-purple-400 text-xs font-bold">+{calculateTimeBonus(stageElapsedTime)} PTS</div>
              </div>
            </div>

            <div className="relative bg-black/60 backdrop-blur-sm border-4 border-orange-400/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-700/20 animate-pulse" />
              <div className="relative">
                <div className="text-orange-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                  🏁 TOTAL
                </div>
                <div className="text-white text-4xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(251, 146, 60, 0.8)'
                }}>
                  {formatTime(
                    stageTimes.reduce((sum, st) => sum + st.time, 0) + 
                    (stageComplete ? 0 : stageElapsedTime)
                  )}
                </div>
              </div>
            </div>

            <div className="relative bg-black/60 backdrop-blur-sm border-4 border-yellow-400/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 animate-pulse" />
              <div className="relative">
                <div className="text-yellow-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  🏆 SCORE
                </div>
                <div className="text-white text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(250, 204, 21, 0.8)'
                }}>{totalScore}</div>
              </div>
            </div>

            <div className="relative bg-black/60 backdrop-blur-sm border-4 border-pink-400/50 rounded-2xl p-5 overflow-hidden shadow-2xl group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-700/20 animate-pulse" />
              <div className="relative">
                <div className="text-pink-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                  💡 HINTS
                </div>
                <div className="text-white text-5xl font-black tabular-nums" style={{
                  textShadow: '0 0 20px rgba(244, 114, 182, 0.8)'
                }}>{hintsUsedInStage}</div>
                <div className="text-pink-400 text-xs font-bold">
                  {totalHintsUsed}/{MAX_HINTS_TOTAL} TOTAL | -{hintsUsedInStage * 20} PTS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-6">
          {/* Database Viewer Sidebar */}
          <DatabaseViewer roomId="football" />

          {/* Main Content */}
          <div className="flex-1 grid lg:grid-cols-5 gap-6">
            {/* Story Section - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Brief Card */}
              <div className="backdrop-blur-2xl bg-gradient-to-br from-green-900/90 to-emerald-900/90 border-2 border-green-400/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent animate-pulse" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl shadow-2xl animate-pulse" style={{
                      boxShadow: '0 0 30px rgba(74, 222, 128, 0.6)'
                    }}>
                      🎯
                    </div>
                    <h2 className="text-3xl font-black text-white drop-shadow-lg">{stageData.title}</h2>
                  </div>
                  
                  <p className="text-green-50 text-lg leading-relaxed mb-6">{stageData.story}</p>
                  
                  <div className="bg-yellow-400/20 border-l-8 border-yellow-400 rounded-r-2xl p-6 shadow-xl" style={{
                    boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)'
                  }}>
                    <div className="font-black text-yellow-100 text-lg mb-2 flex items-center gap-2">
                      <span className="text-2xl">⚡</span> MISSION OBJECTIVE
                    </div>
                    <p className="text-yellow-50 text-base">{stageData.description}</p>
                  </div>
                </div>
              </div>

              {/* Hints Section */}
              <div className="backdrop-blur-2xl bg-gradient-to-br from-amber-900/80 to-orange-900/80 border-2 border-amber-400/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent animate-pulse" />
                <div className="relative space-y-4">
                  {/* Regular Hint Button */}
                  <button
                    onClick={showNextHint}
                    disabled={!canUseHint()}
                    className={`w-full font-black text-lg py-5 px-8 rounded-2xl transition-all transform shadow-2xl ${
                      canUseHint()
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 hover:scale-105 text-white'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    style={{
                      boxShadow: canUseHint() ? '0 0 30px rgba(245, 158, 11, 0.6)' : 'none'
                    }}
                  >
                    💡 UNLOCK HINT ({hintsUsedInStage}/{MAX_HINTS_PER_STAGE} used)
                    <div className="text-xs mt-1">
                      {totalHintsUsed}/{MAX_HINTS_TOTAL} total game hints used
                    </div>
                  </button>

                  {/* AI Hint Button */}
                  <button
                    onClick={getAiHint}
                    disabled={aiHintsUsed >= MAX_AI_HINTS || isLoadingAiHint}
                    className={`w-full font-black text-lg py-5 px-8 rounded-2xl transition-all transform shadow-2xl ${
                      aiHintsUsed >= MAX_AI_HINTS || isLoadingAiHint
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 hover:scale-105 text-white'
                    }`}
                    style={{
                      boxShadow: aiHintsUsed < MAX_AI_HINTS && !isLoadingAiHint ? '0 0 30px rgba(168, 85, 247, 0.6)' : 'none'
                    }}
                  >
                    {isLoadingAiHint ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⚙️</span>
                        AI THINKING...
                      </>
                    ) : (
                      <>
                        🤖 AI STRATEGIC HINT ({aiHintsUsed}/{MAX_AI_HINTS} used)
                        <div className="text-xs mt-1">
                          Powered by Gemini • -30 pts • Unique perspective
                        </div>
                      </>
                    )}
                  </button>
                  
                  {/* Show Regular Hint */}
                  {showHint && currentHintIndex >= 0 && (
                    <div className="mt-6 bg-yellow-400/20 border-2 border-yellow-400/60 rounded-2xl p-6 animate-fadeIn shadow-xl" style={{
                      boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)'
                    }}>
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">💡</span>
                        <p className="text-yellow-50 text-lg leading-relaxed flex-1 font-semibold">{stageData.hints[currentHintIndex]}</p>
                      </div>
                    </div>
                  )}

                  {/* Show AI Hint */}
                  {aiHint && (
                    <div className="mt-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-purple-400/60 rounded-2xl p-6 animate-fadeIn shadow-xl" style={{
                      boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
                    }}>
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">🤖</span>
                        <div className="flex-1">
                          <div className="text-purple-300 text-xs font-bold uppercase mb-2">🎯 AI Strategic Hint (Unique Perspective)</div>
                          <p className="text-purple-50 text-lg leading-relaxed font-semibold">{aiHint}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SQL Editor Section - 3 columns */}
            <div className="lg:col-span-3">
              <div className="backdrop-blur-2xl bg-white/98 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-300 hover:scale-[1.01] transition-transform">
                <SQLEditor 
                  roomId="football"
                  onQuerySuccess={handleQuerySuccess}
                  hideDbInfo={true}
                />
                
                {validationError && (
                  <div className="p-6 pt-0">
                    <div className="bg-red-50 border-red-400 border-4 rounded-2xl p-6 shadow-xl animate-pulse">
                      <div className="flex items-start gap-4">
                        <span className="text-5xl">❌</span>
                        <div className="flex-1">
                          <div className="font-black text-red-900 text-xl mb-2">NOT QUITE RIGHT!</div>
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 border-8 border-yellow-400 rounded-3xl p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden" style={{
              boxShadow: '0 0 60px rgba(250, 204, 21, 0.8), 0 20px 60px rgba(0, 0, 0, 0.5)'
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
                      opacity: 0.7
                    }}
                  >
                    {['🎉', '⚽', '🏆', '✨', '🎊'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>

              <div className="relative text-center mb-8">
                <div className="text-9xl mb-6 animate-bounce">🎉</div>
                <h3 className="text-6xl font-black text-white mb-4 drop-shadow-2xl" style={{
                  textShadow: '0 0 40px rgba(250, 204, 21, 1), 0 4px 20px rgba(0, 0, 0, 0.8)'
                }}>STAGE COMPLETE!</h3>
                <div className="text-yellow-300 text-2xl font-bold animate-pulse">🏆 Outstanding Performance!</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/50 rounded-2xl p-6 border-4 border-green-400/50 shadow-2xl">
                  <div className="text-green-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    ⏱️ TIME
                  </div>
                  <div className="text-white text-4xl font-black tabular-nums">{formatTime(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/50 rounded-2xl p-6 border-4 border-green-400/50 shadow-2xl">
                  <div className="text-green-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                    ⚡ TIME BONUS
                  </div>
                  <div className="text-yellow-400 text-4xl font-black tabular-nums">+{calculateTimeBonus(stageElapsedTime)}</div>
                </div>
                <div className="bg-black/50 rounded-2xl p-6 border-4 border-green-400/50 shadow-2xl">
                  <div className="text-green-300 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                    💡 HINTS USED
                  </div>
                  <div className="text-orange-400 text-4xl font-black tabular-nums">-{hintsUsedInStage * 20}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 border-4 border-yellow-300 shadow-2xl" style={{
                  boxShadow: '0 0 40px rgba(250, 204, 21, 0.6)'
                }}>
                  <div className="text-yellow-900 text-sm font-black mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
                    🏆 STAGE SCORE
                  </div>
                  <div className="text-white text-5xl font-black tabular-nums drop-shadow-lg">{Math.max(0, calculateTimeBonus(stageElapsedTime) - (hintsUsedInStage * 20))}</div>
                </div>
              </div>

              {currentStage < roomData.stages.length ? (
                <button
                  onClick={nextStage}
                  className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 hover:from-green-500 hover:via-emerald-600 hover:to-green-700 text-white font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl"
                  style={{
                    boxShadow: '0 0 40px rgba(74, 222, 128, 0.6)'
                  }}
                >
                  ➡️ CONTINUE TO NEXT STAGE
                </button>
              ) : (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="text-8xl mb-4 animate-bounce">🏆</div>
                    <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-2xl" style={{
                      textShadow: '0 0 40px rgba(250, 204, 21, 1)'
                    }}>MISSION COMPLETE!</h2>
                    <p className="text-green-200 text-xl font-bold">✅ Corruption Exposed! You're a Legend!</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-black/60 rounded-2xl p-6 text-center border-4 border-yellow-400/50 shadow-2xl">
                      <div className="text-green-300 text-sm font-bold mb-2">🏆 TOTAL SCORE</div>
                      <div className="text-white text-4xl font-black tabular-nums">{totalScore}</div>
                    </div>
                    <div className="bg-black/60 rounded-2xl p-6 text-center border-4 border-yellow-400/50 shadow-2xl">
                      <div className="text-green-300 text-sm font-bold mb-2">⏱️ TOTAL TIME</div>
                      <div className="text-white text-4xl font-black tabular-nums">
                        {formatTime(stageTimes.reduce((sum, st) => sum + st.time, 0))}
                      </div>
                    </div>
                    <div className="bg-black/60 rounded-2xl p-6 text-center border-4 border-yellow-400/50 shadow-2xl">
                      <div className="text-green-300 text-sm font-bold mb-2">💡 TOTAL HINTS</div>
                      <div className="text-white text-4xl font-black tabular-nums">{totalHintsUsed}</div>
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-2xl p-8 border-4 border-green-400/50 shadow-2xl">
                    <h3 className="text-green-300 font-black text-2xl mb-6 text-center flex items-center justify-center gap-2">
                      <span>📊</span> STAGE BREAKDOWN
                    </h3>
                    <div className="space-y-4">
                      {stageTimes.map((stageTime, index) => (
                        <div key={index} className="flex justify-between items-center bg-green-900/40 rounded-xl p-5 border-2 border-green-500/30 hover:bg-green-900/60 transition-colors">
                          <span className="text-white font-black text-xl">🎯 Stage {stageTime.stage}</span>
                          <span className="text-green-300 font-bold text-lg tabular-nums">{formatTime(stageTime.time)}</span>
                          <span className="text-purple-400 font-bold text-lg">💡 {stageTime.hintsUsed} hints</span>
                          <span className="text-yellow-400 font-black text-xl">{stageTime.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-black text-2xl py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)'
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
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-black/80 border-t-2 border-yellow-400/50">
        <div 
          className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-all duration-500 relative shadow-2xl"
          style={{ 
            width: `${(currentStage / roomData.stages.length) * 100}%`,
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.8)'
          }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xl animate-bounce">
            ⚽
          </div>
        </div>
      </div>

      {crowdSound && (
        <audio className="hidden" autoPlay loop>
          <source src="/audio/converted_audio.mp3" type="audio/mpeg" />
        </audio>
      )}

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

export default FootballRoom;
