import React, { useState, useRef } from 'react';
import { Participant, Prize, RiggedRule } from '../types';
import { Upload, Trash2, Plus, Gift, Users, Settings, Lock } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';

interface AdminPanelProps {
  participants: Participant[];
  prizes: Prize[];
  riggedRules: RiggedRule[];
  onImportParticipants: (data: Participant[]) => void;
  onAddPrize: (prize: Prize) => void;
  onDeletePrize: (id: string) => void;
  onAddRule: (rule: RiggedRule) => void;
  onRemoveRule: (prizeId: string, participantId: string) => void;
  onClose: () => void;
  onReset: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  participants,
  prizes,
  riggedRules,
  onImportParticipants,
  onAddPrize,
  onDeletePrize,
  onAddRule,
  onRemoveRule,
  onClose,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'prizes' | 'rigging'>('users');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Prize State
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCount, setNewPrizeCount] = useState(1);
  const [newPrizeImage, setNewPrizeImage] = useState('');

  // Rigging State
  const [selectedPrizeId, setSelectedPrizeId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await parseExcelFile(e.target.files[0]);
        onImportParticipants(data);
        alert(`Successfully imported ${data.length} participants!`);
      } catch (err) {
        console.error(err);
        alert('Error parsing Excel file. Ensure it has columns for ID and Name.');
      }
    }
  };

  const handleCreatePrize = () => {
    if (!newPrizeName) return;
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      name: newPrizeName,
      count: newPrizeCount,
      image: newPrizeImage || `https://picsum.photos/200/200?random=${Math.random()}`,
      level: prizes.length + 1
    };
    onAddPrize(newPrize);
    setNewPrizeName('');
    setNewPrizeCount(1);
    setNewPrizeImage('');
  };

  const handleAddRule = () => {
    if (!selectedPrizeId || !selectedUserId) return;
    onAddRule({
        prizeId: selectedPrizeId,
        participantId: selectedUserId
    });
    setSelectedUserId(''); // Reset user selection
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90vw] h-[85vh] bg-[#0f0f13] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Settings className="text-cyber-primary" /> Configuration
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900/30 border-r border-gray-800 flex flex-col p-4 gap-2">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Users size={18} /> Participants
            </button>
            <button 
              onClick={() => setActiveTab('prizes')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'prizes' ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Gift size={18} /> Prizes
            </button>
            <button 
              onClick={() => setActiveTab('rigging')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'rigging' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Lock size={18} /> Default Winners
            </button>

            <div className="mt-auto pt-4 border-t border-gray-800">
                <button 
                    onClick={() => {
                        if(confirm('Are you sure you want to reset all winners and history?')) {
                            onReset();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 transition-all"
                >
                    <Trash2 size={16} /> Reset All
                </button>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Import Data</h3>
                    <p className="text-gray-400 text-sm">Upload an .xlsx file with columns: ID, Name, Department</p>
                  </div>
                  <div className="flex gap-4">
                     <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-cyber-primary text-black font-bold px-6 py-3 rounded-full hover:bg-cyan-300 transition-colors"
                      >
                        <Upload size={18} /> Upload Excel
                      </button>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Participant List ({participants.length})</h3>
                  <div className="h-[400px] overflow-y-auto rounded-lg border border-gray-800">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3 text-sm font-semibold text-gray-400">ID</th>
                          <th className="p-3 text-sm font-semibold text-gray-400">Name</th>
                          <th className="p-3 text-sm font-semibold text-gray-400">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, idx) => (
                          <tr key={p.id + idx} className="border-t border-gray-800 hover:bg-white/5">
                            <td className="p-3 text-gray-300 font-mono text-sm">{p.id}</td>
                            <td className="p-3 text-white font-medium">{p.name}</td>
                            <td className="p-3 text-gray-400">{p.department}</td>
                          </tr>
                        ))}
                        {participants.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-gray-500">No participants imported yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PRIZES TAB */}
            {activeTab === 'prizes' && (
              <div className="space-y-6">
                 <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Add New Prize</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Prize Name</label>
                        <input 
                          type="text" 
                          value={newPrizeName}
                          onChange={(e) => setNewPrizeName(e.target.value)}
                          placeholder="e.g. iPhone 16 Pro Max"
                          className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyber-primary outline-none"
                        />
                      </div>
                      <div>
                         <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                         <input 
                          type="number" 
                          min={1}
                          value={newPrizeCount}
                          onChange={(e) => setNewPrizeCount(Number(e.target.value))}
                          className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyber-primary outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleCreatePrize}
                        className="bg-cyber-secondary text-white font-bold px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors h-[42px] flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Add
                      </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prizes.map((prize) => (
                      <div key={prize.id} className="glass-panel p-4 rounded-xl relative group">
                        <button 
                          onClick={() => onDeletePrize(prize.id)}
                          className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex items-center gap-4">
                           <img src={prize.image} alt={prize.name} className="w-16 h-16 rounded-lg object-cover bg-gray-800" />
                           <div>
                              <h4 className="font-bold text-white">{prize.name}</h4>
                              <p className="text-cyber-primary text-sm">{prize.count} Winners</p>
                              <p className="text-xs text-gray-500">Level {prize.level}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* RIGGING TAB */}
            {activeTab === 'rigging' && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-red-500">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Lock className="text-red-500" /> "Magic" Configuration
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Configure specific participants to win specific prizes. These rules take precedence during the draw.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/30 p-4 rounded-lg">
                        <div>
                             <label className="block text-xs text-gray-400 mb-1">Select Prize</label>
                             <select 
                                value={selectedPrizeId}
                                onChange={(e) => setSelectedPrizeId(e.target.value)}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none"
                             >
                                <option value="">-- Select Prize --</option>
                                {prizes.map(p => <option key={p.id} value={p.id}>{p.name} ({p.count})</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs text-gray-400 mb-1">Select Person (Search by Name/ID)</label>
                             <select 
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none"
                             >
                                <option value="">-- Select Person --</option>
                                {participants.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                ))}
                             </select>
                        </div>
                        <button 
                            onClick={handleAddRule}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg h-[42px]"
                        >
                            Set Rule
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Active Rules</h3>
                    <div className="space-y-2">
                        {riggedRules.map((rule, idx) => {
                            const prize = prizes.find(p => p.id === rule.prizeId);
                            const user = participants.find(p => p.id === rule.participantId);
                            if (!prize || !user) return null;
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="text-cyber-secondary font-bold">{user.name}</div>
                                        <div className="text-gray-500 text-sm">will win</div>
                                        <div className="text-cyber-primary font-bold">{prize.name}</div>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveRule(rule.prizeId, rule.participantId)}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )
                        })}
                        {riggedRules.length === 0 && <div className="text-gray-500 italic">No active rules. Fair play!</div>}
                    </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
