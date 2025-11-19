import React, { useState } from 'react';
import { CycloParams } from '../types';
import { analyzeDesign, chatWithEngineer, generateDesignParameters, GeneratedDesign } from '../services/geminiService';
import { calculateMinWallThickness } from '../utils/geometry';
import { generateCycloidProfile } from '../utils/geometry';
import { Bot, Send, Loader2, FileText, MessageSquare, Wand2, Check, ArrowRight } from 'lucide-react';

interface AIAssistantProps {
  params: CycloParams;
  onApplyParameters?: (params: CycloParams) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ params, onApplyParameters }) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate' | 'chat'>('generate');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);

  // Generator state
  const [genInput, setGenInput] = useState("");
  const [generatedDesign, setGeneratedDesign] = useState<GeneratedDesign | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const points = generateCycloidProfile(params);
    const minWall = calculateMinWallThickness(points, params.holeRadius);
    const result = await analyzeDesign(params, minWall);
    setAnalysis(result);
    setLoading(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
        const response = await chatWithEngineer(chatHistory, userMsg);
        setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
        setChatHistory(prev => [...prev, { role: 'model', text: "Error: Could not connect to engineer." }]);
    }
  };

  const handleGenerate = async () => {
    if(!genInput.trim()) return;
    setLoading(true);
    setGeneratedDesign(null);
    const result = await generateDesignParameters(genInput);
    setGeneratedDesign(result);
    setLoading(false);
  };

  const applyGenerated = () => {
      if (generatedDesign && onApplyParameters) {
          onApplyParameters(generatedDesign.params);
          setGeneratedDesign(null); // Clear after applying
          setActiveTab('analyze'); // Switch to analysis to see specs
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'generate' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 size={16} /> Generator
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'analyze' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={16} /> Analyze
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'chat' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare size={16} /> Chat
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* --- GENERATOR TAB --- */}
        {activeTab === 'generate' && (
            <div className="p-6 overflow-y-auto h-full flex flex-col">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
                        <Wand2 size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Design Generator</h3>
                    <p className="text-slate-400 text-xs mt-1">
                        Describe your needs (size, torque, application) and AI will suggest the perfect parameters.
                    </p>
                </div>

                <textarea
                    value={genInput}
                    onChange={(e) => setGenInput(e.target.value)}
                    placeholder="E.g. 'A compact drive for a NEMA 17 stepper motor, need high reduction ratio around 40:1 for a telescope mount.'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-32 mb-4"
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading || !genInput}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 mb-6"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    {loading ? 'Generating...' : 'Generate Parameters'}
                </button>

                {generatedDesign && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-emerald-400 text-sm font-bold uppercase tracking-wide">Suggestion</h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 italic">
                            "{generatedDesign.reasoning}"
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4 font-mono bg-slate-900/50 p-3 rounded-lg">
                            <div>Pins: <span className="text-white">{generatedDesign.params.pinCount}</span></div>
                            <div>Ratio: <span className="text-white">{generatedDesign.params.pinCount - 1}:1</span></div>
                            <div>Radius: <span className="text-white">{generatedDesign.params.pinCircleRadius}mm</span></div>
                            <div>Ecc: <span className="text-white">{generatedDesign.params.eccentricity}mm</span></div>
                        </div>

                        <button 
                            onClick={applyGenerated}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            Apply to Design <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- ANALYSIS TAB --- */}
        {activeTab === 'analyze' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="mb-6 text-center">
              <Bot size={48} className="mx-auto text-blue-500 mb-4 p-3 bg-blue-500/10 rounded-full" />
              <h3 className="text-lg font-semibold text-white mb-2">Design Validator</h3>
              <p className="text-slate-400 text-sm mb-6">
                Generate an engineering report for your current configuration.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Bot size={18} />}
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>

            {analysis && (
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <div className="prose prose-invert prose-sm max-w-none">
                    {/* Simple markdown rendering replacement */}
                    {analysis.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} className="text-blue-300 font-bold mt-4 mb-2">{line.replace(/#/g, '')}</h3>;
                        if (line.startsWith('-')) return <li key={i} className="ml-4 text-slate-300">{line.substring(1)}</li>;
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="text-slate-300">{line}</p>;
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CHAT TAB --- */}
        {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            <p>Ask me anything about materials, tolerances, or gear physics.</p>
                        </div>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-purple-600 text-white rounded-br-none' 
                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleChat} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Ask about gearbox design..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <button type="submit" className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-500">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
