"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Clock, Users, Zap, 
  Wifi, Mic, Video, Eye, MoreHorizontal,
  PlayCircle, StopCircle, ChevronRight
} from "lucide-react";
import Navbar from "../components/Navbar"; 
import { RUN_OF_SHOW } from "../lib/data"; 
import { useBooking } from "../context/BookingContext";

// --- DUMMY SPARKLINE DATA ---
const SPARKLINE_DATA = [40, 45, 60, 55, 70, 65, 80, 85, 82, 90, 95, 100, 98, 105, 110];

export default function StudioPage() {
  const [activeSegment, setActiveSegment] = useState(1);
  const [timeLeft, setTimeLeft] = useState(599); 
  const [chatLog, setChatLog] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { prompterMessage } = useBooking();

  // --- TIMERS & SIMULATIONS ---
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-scroll chat
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    const comments = [
        { user: "sarah_j", text: "Love this!", color: "text-pink-400" },
        { user: "mike_t", text: "Where is the code?", color: "text-blue-400" },
        { user: "jess99", text: "Does it come in black?", color: "text-purple-400" },
        { user: "alex_r", text: "Show the bag again!", color: "text-green-400" },
        { user: "bruno_x", text: "Hello from Brazil! 🇧🇷", color: "text-yellow-400" }
    ];
    const chatInterval = setInterval(() => {
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      setChatLog(prev => [...prev.slice(-8), { ...randomComment, id: Date.now() }]); 
    }, 2500);
    return () => clearInterval(chatInterval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col selection:bg-blue-500/30">
      <Navbar />
      
      {/* --- TOP BAR: GLOBAL STATUS --- */}
      <div className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-black tracking-widest uppercase text-red-500">Live On Air</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Wifi size={14} className="text-green-500"/> Stream: <span className="text-white">Excellent (1080p)</span>
            </div>
         </div>
         
         <div className="flex items-center gap-4">
             <div className="text-right">
                 <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Session Timer</div>
                 <div className="text-xl font-mono font-bold leading-none">{formatTime(timeLeft)}</div>
             </div>
             <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                End Stream
             </button>
         </div>
      </div>

      <div className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-w-[1920px] mx-auto w-full">
        
        {/* === LEFT COLUMN: MONITOR & METRICS === */}
        <div className="flex-[2] flex flex-col gap-6 min-w-0">
          
          {/* 1. MAIN MONITOR (The "Enticing" Part) */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group">
             {/* Fake Video Feed (Placeholder gradient) */}
             <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                 <div className="text-center">
                     <Video size={48} className="mx-auto text-zinc-700 mb-4"/>
                     <p className="text-zinc-600 font-mono text-sm">WAITING FOR SIGNAL...</p>
                 </div>
             </div>
             
             {/* Monitor Overlays */}
             <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono border border-white/10 text-zinc-300">
                CAM-A (PRO)
             </div>
             <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                 {/* Lower Third Preview */}
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-white/90 text-black px-6 py-3 rounded-lg inline-block shadow-lg"
                 >
                    <h2 className="font-bold text-lg">Summer Collection Drop</h2>
                    <p className="text-xs font-mono uppercase tracking-widest text-blue-600">Use Code: LIVE20</p>
                 </motion.div>
             </div>
             
             {/* Monitor Safety Guides (The "Pro" look) */}
             <div className="absolute inset-0 border-[40px] border-transparent pointer-events-none">
                 <div className="w-full h-full border border-white/5 opacity-50 relative">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/20"></div>
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/20"></div>
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/20"></div>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/20"></div>
                 </div>
             </div>
          </div>

          {/* 2. METRICS DECK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Viewers */}
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
                 <div className="flex justify-between items-start mb-2">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Live Viewers</div>
                    <Eye size={14} className="text-blue-500"/>
                 </div>
                 <div className="text-3xl font-mono font-bold mb-2">12,403</div>
                 {/* CSS Sparkline */}
                 <div className="h-8 flex items-end gap-1">
                    {SPARKLINE_DATA.map((val, i) => (
                        <div key={i} style={{ height: `${val}%` }} className="flex-1 bg-blue-500/20 rounded-t-sm relative group">
                            <div className="absolute bottom-0 left-0 w-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" style={{ height: '100%' }}></div>
                        </div>
                    ))}
                 </div>
              </div>
              
              {/* Card 2: Engagement */}
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
                 <div className="flex justify-between items-start mb-2">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Engagement Rate</div>
                    <Zap size={14} className="text-yellow-500"/>
                 </div>
                 <div className="text-3xl font-mono font-bold mb-2">18.4%</div>
                 <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-yellow-500 w-[65%] h-full rounded-full animate-pulse"></div>
                 </div>
                 <p className="text-[10px] text-zinc-500 mt-2">+2.4% vs last stream</p>
              </div>

              {/* Card 3: Prompter Status (The user's context) */}
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl relative overflow-hidden">
                 <div className="flex justify-between items-start mb-2">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Teleprompter Output</div>
                    <MessageSquare size={14} className="text-green-500"/>
                 </div>
                 <div className="absolute inset-0 bg-green-500/5 pointer-events-none"></div>
                 <div className="h-20 flex items-center">
                    <p className="text-lg font-medium text-green-100 line-clamp-2">
                       "{prompterMessage || "Waiting for input..."}"
                    </p>
                 </div>
              </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: CONTROLS === */}
        <div className="flex-1 min-w-[350px] max-w-[450px] flex flex-col gap-6">
           
           {/* 1. RUN OF SHOW */}
           <div className="bg-zinc-900 border border-white/5 rounded-xl flex flex-col flex-1 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 bg-zinc-900 sticky top-0 z-10 flex justify-between items-center">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Run of Show</h3>
                 <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400">Auto-Cue: ON</span>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                 {RUN_OF_SHOW.map((item, index) => {
                   const isActive = index === activeSegment;
                   const isPast = index < activeSegment;
                   
                   return (
                    <div 
                        key={index}
                        onClick={() => setActiveSegment(index)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                            isActive 
                            ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)] relative z-10" 
                            : isPast 
                                ? "bg-zinc-900/50 border-transparent opacity-50 grayscale"
                                : "bg-zinc-800/30 border-transparent hover:bg-zinc-800"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                {isActive && <PlayCircle size={12} className="text-blue-400 animate-pulse"/>}
                                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                                    {item.time}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600">{item.duration}</span>
                        </div>
                        <div className={`text-sm font-bold mb-0.5 ${isActive ? 'text-white' : 'text-zinc-400'}`}>{item.title}</div>
                        {isActive && <div className="text-xs text-blue-200/70 leading-snug mt-1 animate-in fade-in">{item.notes}</div>}
                    </div>
                   );
                 })}
              </div>
           </div>

           {/* 2. LIVE CHAT STREAM */}
           <div className="h-64 bg-zinc-900 border border-white/5 rounded-xl flex flex-col overflow-hidden">
               <div className="p-3 border-b border-white/5 bg-zinc-800/50 flex justify-between items-center">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live Chat</h3>
                 <Users size={12} className="text-zinc-600"/>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 relative" ref={chatContainerRef}>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none z-10 h-12 top-auto bottom-0"></div>
                  <AnimatePresence>
                    {chatLog.map((msg) => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs grid grid-cols-[auto_1fr] gap-2 items-baseline"
                        >
                            <span className={`font-bold ${msg.color}`}>{msg.user}:</span>
                            <span className="text-zinc-300">{msg.text}</span>
                        </motion.div>
                    ))}
                  </AnimatePresence>
              </div>
              <div className="p-2 border-t border-white/5">
                  <input type="text" disabled placeholder="Chat is read-only" className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-2 text-xs text-zinc-500 cursor-not-allowed"/>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}