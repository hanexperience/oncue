"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Users, Zap, Wifi, Video, Eye, 
  PlayCircle, Mic, AlertCircle
} from "lucide-react";
import Navbar from "../components/Navbar"; 
import { RUN_OF_SHOW } from "../lib/data"; 
import { useBooking } from "../context/BookingContext";
// import StreamPlayer from "../components/StreamPlayer"; // Uncomment if you have this component ready

export default function StudioPage() {
  const [activeSegment, setActiveSegment] = useState(1);
  const [timeLeft, setTimeLeft] = useState(599); 
  const [chatLog, setChatLog] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // This hook grabs the real-time message sent by the client/brand
  const { prompterMessage } = useBooking(); 

  // --- TIMERS & SIMULATIONS ---
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  // Simulate Chat
  useEffect(() => {
    const comments = [
        { user: "sarah_j", text: "Love this!", color: "text-pink-400" },
        { user: "mike_t", text: "Where is the code?", color: "text-blue-400" },
        { user: "jess99", text: "Does it come in black?", color: "text-purple-400" },
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
      
      {/* --- TOP HEADER: STATUS --- */}
      <div className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-red-500">On Air</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-1.5"><Wifi size={14} className="text-green-500"/> Bitrate: 6000kbps</div>
                <div className="flex items-center gap-1.5"><Mic size={14} className="text-green-500"/> Audio: Good</div>
            </div>
         </div>
         
         <div className="flex items-center gap-4">
             <div className="text-right">
                 <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Stream Timer</div>
                 <div className="text-xl font-mono font-bold leading-none">{formatTime(timeLeft)}</div>
             </div>
             <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20">
                Stop Stream
             </button>
         </div>
      </div>

      <div className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden max-w-[1920px] mx-auto w-full">
        
        {/* === LEFT COLUMN: MONITOR & MESSAGE === */}
        <div className="flex-[2] flex flex-col gap-6 min-w-0">
          
          {/* 1. SELF-VIEW MONITOR */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group">
             
             {/* Replace this div with <StreamPlayer /> when real */}
             <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                 <div className="text-center opacity-50">
                     <Video size={48} className="mx-auto text-zinc-700 mb-4"/>
                     <p className="text-zinc-600 font-mono text-sm">SELF VIEW FEED</p>
                 </div>
             </div>
             
             {/* Tally Light Overlay */}
             <div className="absolute top-4 right-4 flex gap-2">
                <div className="bg-red-600/90 backdrop-blur px-3 py-1 rounded text-[10px] font-bold uppercase text-white shadow-lg">
                   Live Output
                </div>
             </div>
          </div>

          {/* 2. DIRECTOR MESSAGE (The "Client" Communication Channel) */}
          <div className="relative">
             {/* Glowing Border if there is a message */}
             <div className={`absolute -inset-0.5 rounded-2xl blur opacity-20 transition-opacity duration-500 ${prompterMessage ? 'bg-blue-500 opacity-75' : 'bg-transparent'}`}></div>
             
             <div className="relative bg-zinc-900 border border-white/10 p-6 rounded-xl shadow-xl flex items-center gap-6">
                 {/* Icon Indicator */}
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${prompterMessage ? 'bg-blue-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-600'}`}>
                    {prompterMessage ? <AlertCircle size={24} /> : <MessageSquare size={24} />}
                 </div>

                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                           Message from Director
                        </h3>
                        {prompterMessage && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase font-bold">New Instruction</span>}
                    </div>
                    
                    {/* The Message */}
                    <AnimatePresence mode="wait">
                        <motion.p 
                           key={prompterMessage || 'empty'}
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -5 }}
                           className={`text-xl md:text-2xl font-medium leading-snug ${prompterMessage ? 'text-white' : 'text-zinc-600 italic'}`}
                        >
                           "{prompterMessage || "No active instructions. Stick to the brief."}"
                        </motion.p>
                    </AnimatePresence>
                 </div>
             </div>
          </div>

          {/* 3. METRICS */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                 <div>
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Live Viewers</div>
                    <div className="text-2xl font-mono font-bold">12,403</div>
                 </div>
                 <Eye size={20} className="text-blue-500 opacity-50"/>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                 <div>
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Engagement</div>
                    <div className="text-2xl font-mono font-bold">High 🔥</div>
                 </div>
                 <Zap size={20} className="text-yellow-500 opacity-50"/>
              </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: TIMELINE & CHAT === */}
        <div className="flex-1 min-w-[350px] max-w-[450px] flex flex-col gap-6">
           
           {/* 1. RUN OF SHOW (Interactive Checklist) */}
           <div className="bg-zinc-900 border border-white/5 rounded-xl flex flex-col flex-1 overflow-hidden shadow-xl max-h-[400px]">
              <div className="p-4 border-b border-white/5 bg-zinc-900 sticky top-0 z-10">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Run of Show</h3>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                 {RUN_OF_SHOW.map((item, index) => {
                   const isActive = index === activeSegment;
                   return (
                    <div 
                        key={index}
                        onClick={() => setActiveSegment(index)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                            isActive 
                            ? "bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative z-10" 
                            : "bg-zinc-800/30 border-transparent hover:bg-zinc-800"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                {isActive && <PlayCircle size={12} className="text-green-400 animate-pulse"/>}
                                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-green-400' : 'text-zinc-500'}`}>
                                    {item.time}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600">{item.duration}</span>
                        </div>
                        <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-zinc-400'}`}>{item.title}</div>
                    </div>
                   );
                 })}
              </div>
           </div>

           {/* 2. CHAT (Crucial for Influencer) */}
           <div className="h-80 bg-zinc-900 border border-white/5 rounded-xl flex flex-col overflow-hidden">
               <div className="p-3 border-b border-white/5 bg-zinc-800/50 flex justify-between items-center">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stream Chat</h3>
                 <Users size={12} className="text-zinc-600"/>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={chatContainerRef}>
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
           </div>

        </div>
      </div>
    </div>
  );
}