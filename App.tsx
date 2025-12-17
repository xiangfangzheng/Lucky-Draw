import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Settings, Maximize2, Gift, Users, Trophy } from 'lucide-react';
import { Participant, Prize, Winner, RiggedRule } from './types';
import Background from './components/Background';
import AdminPanel from './components/AdminPanel';
import SlotMachine from './components/SlotMachine';

const App: React.FC = () => {
  // --- STATE ---
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [riggedRules, setRiggedRules] = useState<RiggedRule[]>([]);
  
  // Game State
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentPrizeId, setCurrentPrizeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [roundWinners, setRoundWinners] = useState<Participant[] | null>(null);

  // --- DERIVED STATE ---
  const currentPrize = useMemo(() => prizes.find(p => p.id === currentPrizeId), [currentPrizeId, prizes]);
  
  // Participants who haven't won anything yet
  const availableParticipants = useMemo(() => {
    const winnerIds = new Set(winners.map(w => w.participant.id));
    return participants.filter(p => !winnerIds.has(p.id));
  }, [participants, winners]);

  // Winners for the current prize (history)
  const currentPrizeWinners = useMemo(() => {
      if (!currentPrizeId) return [];
      return winners.filter(w => w.prizeId === currentPrizeId);
  }, [winners, currentPrizeId]);

  const remainingCount = currentPrize ? currentPrize.count - currentPrizeWinners.length : 0;

  // --- ACTIONS ---

  const handleDraw = () => {
    if (!currentPrize) return;
    if (isRunning) {
        // STOP THE DRAW
        setIsRunning(false);
        // Logic handled in useEffect or calculated immediately here?
        // Let's calculate immediately to pass to SlotMachine
        const results = determineWinners(currentPrize, remainingCount);
        setRoundWinners(results);
        
        // Don't add to official history until animation completes (handled by SlotMachine callback)
    } else {
        // START THE DRAW
        if (remainingCount <= 0) {
            alert('This prize pool is empty!');
            return;
        }
        if (availableParticipants.length === 0) {
            alert('No more participants available!');
            return;
        }
        setRoundWinners(null);
        setIsRunning(true);
    }
  };

  const determineWinners = (prize: Prize, slots: number): Participant[] => {
    // 1. Check for rigged rules for this prize
    const rulesForPrize = riggedRules.filter(r => r.prizeId === prize.id);
    const forcedWinners: Participant[] = [];

    // Find the forced users if they are still available
    rulesForPrize.forEach(rule => {
        const user = availableParticipants.find(p => p.id === rule.participantId);
        if (user) {
            forcedWinners.push(user);
        }
    });

    // 2. Random fill
    const slotsNeeded = Math.min(slots, 10); // Draw max 10 at a time for UI reasons
    // If we have forced winners, use them first
    let result = [...forcedWinners];
    
    // If forced winners fill all slots, we trim. If not, we fill random.
    if (result.length > slotsNeeded) {
        result = result.slice(0, slotsNeeded);
    } else {
        const neededRandoms = slotsNeeded - result.length;
        // Filter out forced winners from pool to avoid duplicates (already handled by 'availableParticipants' logic usually, but rigorous check here)
        const pool = availableParticipants.filter(p => !result.find(r => r.id === p.id));
        
        // Simple Shuffle
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        result = [...result, ...shuffled.slice(0, neededRandoms)];
    }

    return result;
  };

  const handleRoundComplete = () => {
      if (!currentPrize || !roundWinners) return;
      
      const newWinners: Winner[] = roundWinners.map(p => ({
          id: crypto.randomUUID(),
          participant: p,
          prizeId: currentPrize.id,
          timestamp: Date.now()
      }));

      setWinners(prev => [...prev, ...newWinners]);
      setRoundWinners(null); // CRITICAL FIX: Reset round winners so they don't persist to next prize
      
      // FIREWORKS
      fireConfetti();
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00f3ff', '#bc13fe', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00f3ff', '#bc13fe', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // --- RENDER ---

  return (
    <div className="relative w-full min-h-screen text-white font-sans selection:bg-cyber-primary selection:text-black">
      <Background />

      {/* Navbar */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyber-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_#00f3ff]">
                <Gift className="text-black" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-wider">CYBER<span className="text-cyber-primary">LUCK</span></h1>
        </div>
        <div className="flex gap-4">
             <button 
                onClick={() => document.documentElement.requestFullscreen()}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                title="Fullscreen"
            >
                <Maximize2 size={20} />
             </button>
             <button 
                onClick={() => setIsAdminOpen(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                title="Settings"
            >
                <Settings size={20} />
             </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        
        {/* Prize Selector (If not defined, show setup prompt) */}
        {prizes.length === 0 ? (
            <div className="text-center space-y-6 animate-pulse">
                <h2 className="text-4xl font-bold text-gray-500">Setup Required</h2>
                <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="px-8 py-4 bg-cyber-primary text-black font-bold text-xl rounded-full hover:shadow-[0_0_30px_#00f3ff] transition-all"
                >
                    Open Configuration
                </button>
            </div>
        ) : !currentPrize ? (
             <div className="text-center w-full max-w-4xl">
                <h2 className="text-3xl font-display text-white mb-8">Select a Prize to Draw</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prizes.sort((a,b) => b.level - a.level).map(prize => {
                         const wCount = winners.filter(w => w.prizeId === prize.id).length;
                         const isComplete = wCount >= prize.count;
                         return (
                            <button 
                                key={prize.id}
                                onClick={() => {
                                    setCurrentPrizeId(prize.id);
                                    setRoundWinners(null); // Ensure clean state
                                }}
                                disabled={isComplete}
                                className={`
                                    group relative overflow-hidden rounded-2xl p-6 text-left transition-all border
                                    ${isComplete ? 'border-gray-800 bg-gray-900/50 opacity-50 grayscale' : 'border-gray-600 bg-gray-900/40 hover:border-cyber-primary hover:bg-gray-800'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy size={64} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyber-primary transition-colors">{prize.name}</h3>
                                <div className="flex justify-between items-end mt-4">
                                    <span className="text-sm text-gray-400">Level {prize.level}</span>
                                    <span className={`text-2xl font-display font-bold ${isComplete ? 'text-gray-500' : 'text-cyber-secondary'}`}>
                                        {wCount} / {prize.count}
                                    </span>
                                </div>
                                {isComplete && <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-red-500 -rotate-12 border-4 border-red-500 rounded-xl m-4">COMPLETED</div>}
                            </button>
                         )
                    })}
                </div>
             </div>
        ) : (
            // ACTIVE GAME SCREEN
            <div className="w-full max-w-7xl flex flex-col items-center gap-8">
                {/* Prize Header */}
                <div className="text-center space-y-2 relative">
                    <button 
                        onClick={() => { 
                            if(!isRunning) {
                                setCurrentPrizeId(null);
                                setRoundWinners(null); // Ensure clean state on back
                            }
                        }}
                        className="absolute left-[-60px] top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        disabled={isRunning}
                    >
                        ← Back
                    </button>
                    <div className="inline-block px-4 py-1 rounded-full border border-cyber-secondary/50 text-cyber-secondary text-sm tracking-widest uppercase mb-2 bg-cyber-secondary/10">
                        Current Prize
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyber-primary to-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                        {currentPrize.name}
                    </h1>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <img 
                            src={currentPrize.image} 
                            alt="prize" 
                            className="w-32 h-32 object-cover rounded-xl border-2 border-white/10 shadow-2xl"
                        />
                        <div className="text-left">
                             <div className="text-gray-400 text-sm">Remaining Winners</div>
                             <div className="text-4xl font-mono font-bold text-white">{remainingCount}</div>
                        </div>
                    </div>
                </div>

                {/* Slot Machine Area */}
                <div className="w-full min-h-[300px] flex items-center justify-center py-8">
                    <SlotMachine 
                        candidates={availableParticipants}
                        isRunning={isRunning}
                        finalWinners={roundWinners}
                        onAnimationComplete={handleRoundComplete}
                        drawCount={Math.min(remainingCount, 10)} // If remaining is 50, only draw 10 at a time
                    />
                </div>

                {/* Control Button */}
                <div className="mt-8 z-20">
                    <button
                        onClick={handleDraw}
                        disabled={remainingCount === 0 && !isRunning}
                        className={`
                            relative px-12 py-6 rounded-full font-display font-bold text-2xl tracking-widest transition-all duration-200
                            ${isRunning 
                                ? 'bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:bg-red-600 hover:scale-105' 
                                : remainingCount === 0
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-cyber-primary text-black shadow-[0_0_50px_rgba(0,243,255,0.6)] hover:bg-cyan-300 hover:scale-105 animate-pulse-fast'
                            }
                        `}
                    >
                        {isRunning ? 'STOP' : remainingCount === 0 ? 'FINISHED' : 'START ROLL'}
                    </button>
                </div>

                {/* Winners List (Recent) */}
                {currentPrizeWinners.length > 0 && (
                    <div className="w-full max-w-4xl mt-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="text-yellow-400" /> Winners Circle
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {currentPrizeWinners.map((w, i) => (
                                <div key={i} className="px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-cyber-primary font-bold">{w.participant.name}</span>
                                    <span className="text-xs text-gray-400">({w.participant.id})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* Admin Panel Overlay */}
      {isAdminOpen && (
        <AdminPanel 
            participants={participants}
            prizes={prizes}
            riggedRules={riggedRules}
            onImportParticipants={(data) => setParticipants(prev => [...prev, ...data])}
            onAddPrize={(p) => setPrizes(prev => [...prev, p])}
            onDeletePrize={(id) => setPrizes(prev => prev.filter(p => p.id !== id))}
            onAddRule={(rule) => setRiggedRules(prev => [...prev, rule])}
            onRemoveRule={(pId, uId) => setRiggedRules(prev => prev.filter(r => !(r.prizeId === pId && r.participantId === uId)))}
            onReset={() => {
                setWinners([]);
                setRoundWinners(null);
            }}
            onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
};

export default App;