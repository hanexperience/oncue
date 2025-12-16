"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Users, Zap, Calendar, CheckCircle, 
  MessageSquare, Clock, ShieldCheck, Search, 
  BarChart3, Mic2, LayoutTemplate, Activity, DollarSign, Bell 
} from "lucide-react";

// --- MOCK DATA ---
const INFLUENCERS = [
  { id: 1, name: "Sarah Jenkins", handle: "@sarah.j_style", category: "Fashion", retention: "14m", reliability: "99%", price: "$1,200", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop", live: true },
  { id: 2, name: "TechBreak", handle: "@techbreak_official", category: "Tech", retention: "22m", reliability: "95%", price: "$3,500", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop", live: false },
  { id: 3, name: "Chef Marco", handle: "@marcocooks", category: "Food", retention: "18m", reliability: "92%", price: "$900", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&h=500&fit=crop", live: false },
  { id: 4, name: "FitLife Duo", handle: "@fitlifeduo", category: "Fitness", retention: "35m", reliability: "98%", price: "$2,100", image: "https://images.unsplash.com/photo-1613243555978-636248ed86c6?w=500&h=500&fit=crop", live: true },
];

const RUN_OF_SHOW = [
  { time: "00:00", duration: "5m", title: "Warm Up & Greeting", notes: "Ask audience where they are from. Wait for 1k viewers." },
  { time: "05:00", duration: "10m", title: "The Hook (Trivia)", notes: "Start the trivia game. Remind them of the prize." },
  { time: "15:00", duration: "5m", title: "Product Deep Dive", notes: "Focus on the eco-friendly packaging. Show close up." },
  { time: "20:00", duration: "10m", title: "Q&A + Discount Drop", notes: "Answer 3 questions. Reveal code 'LIVE20'." },
];

const AGENCY_ROSTER = [
  { name: "Sarah Jenkins", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", status: "LIVE", viewers: "12.4k", mood: "Good", time: "08:24" },
  { name: "FitLife Duo", image: "https://images.unsplash.com/photo-1613243555978-636248ed86c6?w=200&h=200&fit=crop", status: "PREPPING", viewers: "-", mood: "-", time: "-05:00" },
  { name: "TechBreak", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop", status: "OFFLINE", viewers: "-", mood: "-", time: "--:--" },
  { name: "Chef Marco", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop", status: "LATE", viewers: "-", mood: "Risk", time: "+02:00" },
];

const MockupBadge = () => (
  <div className="fixed bottom-4 right-4 z-[100] bg-black/80 backdrop-blur border border-white/10 text-white px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest shadow-2xl pointer-events-none select-none opacity-60 hover:opacity-100 transition-opacity">
    Mockup Site • v0.2 Mobile
  </div>
);

// --- COMPONENTS ---

// 1. LANDING PAGE
const LandingPage = ({ onGetStarted, onCreatorClick }: { onGetStarted: () => void, onCreatorClick: () => void }) => (
  <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden selection:bg-red-500 selection:text-white">
    
    {/* Animated Blobs */}
    <div className="absolute top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-red-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none animate-pulse"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

    {/* Navbar */}
    <nav className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center p-6 md:p-8 border-b border-white/10">
      <div className="text-2xl font-bold tracking-tighter">ON CUE</div>
      <div className="flex gap-4 md:gap-6 text-sm text-gray-400 items-center">
        <span className="hover:text-white cursor-pointer hidden md:block">For Brands</span>
        <span className="hover:text-white cursor-pointer hidden md:block">For Talent</span>
        <button onClick={onGetStarted} className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition text-xs md:text-sm">
          Launch App
        </button>
      </div>
    </nav>

    {/* Hero */}
    <main className="relative z-10 flex flex-col items-center justify-center mt-12 md:mt-20 px-4 text-center pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[10px] md:text-xs tracking-widest uppercase mb-6 md:mb-8 text-red-400"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        The Synchronous Economy
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
        className="text-4xl md:text-8xl font-serif font-medium leading-[1] md:leading-[0.95] tracking-tight max-w-5xl"
      >
        Where Brands Direct <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
          & Creators Perform.
        </span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-6 md:mt-8 text-base md:text-xl text-gray-400 max-w-2xl font-light px-4"
      >
        The first marketplace that gives Brands control and Creators confidence. 
        Book structured, professional live streams in seconds.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-8 md:mt-12 flex flex-col md:flex-row gap-4 w-full md:w-auto px-6"
      >
        <button onClick={onGetStarted} className="px-8 py-4 bg-white text-black text-lg font-bold rounded hover:scale-105 transition transform w-full md:w-auto">
          Book Talent
        </button>
        <button onClick={onCreatorClick} className="px-8 py-4 border border-white/20 text-white text-lg font-bold rounded hover:bg-white/10 transition w-full md:w-auto">
          I'm a Creator
        </button>
      </motion.div>

      {/* Trust Bar */}
      <div className="mt-20 md:mt-32 border-t border-white/10 w-full max-w-6xl pt-10 flex flex-wrap justify-center md:justify-between gap-8 md:gap-0 text-gray-600 grayscale opacity-50 text-xs md:text-base font-bold tracking-widest px-4">
        <span>VOGUE</span>
        <span>SAMSUNG</span>
        <span>NETFLIX</span>
        <span>SPOTIFY</span>
        <span>NIKE</span>
      </div>
    </main>
  </div>
);

// 2. MARKETPLACE UI (For Brands)
const Marketplace = () => (
  <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen pb-20">
    <header className="mb-8 md:mb-12">
      <h2 className="text-2xl md:text-3xl font-serif mb-2">Talent Discovery</h2>
      <p className="text-sm md:text-base text-gray-500">Find certified live broadcasters based on retention & brief adherence.</p>
    </header>

    {/* Filters */}
    <div className="flex gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar">
      {["All Talent", "High Retention", "Tech", "Fashion", "Food", "Certified Pro"].map((filter, i) => (
        <button key={i} className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${i === 0 ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'}`}>
          {filter}
        </button>
      ))}
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {INFLUENCERS.map((inf) => (
        <motion.div 
          key={inf.id} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
        >
          {/* Card Header */}
          <div className="h-48 relative p-4 flex flex-col justify-between overflow-hidden">
            <img src={inf.image} alt={inf.name} className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 z-10"></div>
            <div className="flex justify-between items-start relative z-20">
                {inf.live ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase animate-pulse shadow-lg">Live Now</span>
                ) : (
                  <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Offline</span>
                )}
                <span className="bg-white/20 backdrop-blur text-white p-1 rounded-full"><ShieldCheck size={14} /></span>
            </div>
            <div className="text-white font-bold text-lg relative z-20">{inf.name}</div>
          </div>
          
          {/* Metrics */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-gray-500">{inf.handle}</div>
              <div className="text-sm font-bold">{inf.price}<span className="text-gray-400 font-normal text-xs">/hr</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Retention</div>
                <div className="font-mono font-bold text-indigo-600">{inf.retention}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Adherence</div>
                <div className="font-mono font-bold text-green-600">{inf.reliability}</div>
              </div>
            </div>
            <button className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold group-hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
              <Calendar size={16} /> Book Slot
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// 3. SECOND SCREEN APP (For Creators)
const StudioApp = () => {
  const [activeSegment, setActiveSegment] = useState(1);
  const [timeLeft, setTimeLeft] = useState(599); 
  const [chatLog, setChatLog] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const comments = ["Love this!", "Where is the discount code?", "Does it come in black?", "Show the bag again!", "Hello from Brazil!"];
    const chatInterval = setInterval(() => {
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      setChatLog(prev => [...prev.slice(-4), randomComment]); 
    }, 2000);
    return () => clearInterval(chatInterval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    // Switched to min-h-screen for mobile scrolling, fixed height for desktop
    <div className="min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] bg-gray-900 text-white p-4 md:p-8 flex flex-col md:flex-row gap-6 md:overflow-hidden overflow-y-auto pb-20">
      
      {/* LEFT: The HUD */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6">
        {/* Main Timer Block */}
        <div className="bg-black border border-gray-800 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden flex-none md:flex-1 flex flex-col justify-center min-h-[300px]">
          <div className="absolute top-4 left-4 flex gap-2 items-center text-red-500 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs font-bold tracking-widest uppercase">On Air</span>
          </div>
          <div className="absolute top-4 right-4 text-gray-500 text-xs font-mono">
            VIEWERS: <span className="text-white font-bold">12,403</span>
          </div>

          <div className="text-gray-400 text-sm uppercase tracking-widest mb-2 mt-8 md:mt-0">Current Segment Timer</div>
          <div className="text-7xl md:text-9xl font-mono font-bold tracking-tighter text-white">
            {formatTime(timeLeft)}
          </div>
          <div className="mt-4 text-lg md:text-xl text-yellow-400 font-medium animate-pulse">Next: Product Deep Dive (in 2m)</div>
        </div>

        {/* Brand Message/Teleprompter & Chat Grid */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-48">
          <div className="flex-1 bg-gray-800 rounded-2xl p-6 border-l-4 border-blue-500 shadow-lg shadow-blue-500/10 flex flex-col justify-center min-h-[150px]">
            <div className="flex justify-between mb-2">
              <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} /> Brand Director
              </h3>
              <span className="text-gray-500 text-xs">Just now</span>
            </div>
            <p className="text-lg md:text-2xl font-medium leading-relaxed">
              "Don't forget to show the <strong>side pocket</strong>! Comments are asking."
            </p>
          </div>

          <div className="w-full md:w-64 bg-gray-800 rounded-2xl p-4 flex flex-col border border-gray-700 min-h-[150px]">
             <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Live Chat Stream</div>
             <div className="flex-1 flex flex-col justify-end space-y-2 overflow-hidden" ref={chatContainerRef}>
                {chatLog.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm bg-gray-700/50 p-2 rounded text-gray-200 truncate"
                  >
                    {msg}
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Run of Show */}
      <div className="w-full md:w-96 bg-gray-800 rounded-2xl p-6 md:overflow-y-auto border border-gray-700 shadow-xl flex-none">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-gray-700 pb-4">Run of Show</h3>
        <div className="space-y-4">
          {RUN_OF_SHOW.map((item, index) => (
            <div 
              key={index}
              onClick={() => setActiveSegment(index)}
              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                index === activeSegment 
                  ? "bg-gray-700 border-green-500 ring-1 ring-green-500/50 shadow-lg" 
                  : "bg-gray-800/50 border-gray-700 opacity-50 hover:opacity-100"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-mono px-2 py-1 rounded ${index === activeSegment ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-500'}`}>
                  {item.time}
                </span>
                <span className="text-xs text-gray-400">{item.duration}</span>
              </div>
              <div className="font-bold text-white mb-1">{item.title}</div>
              <div className="text-sm text-gray-400 leading-snug">{item.notes}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// 4. AGENCY PORTAL (God Mode for Managers)
const AgencyPortal = () => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif mb-2">Roster Management</h2>
          <p className="text-sm md:text-base text-gray-500">Monitor your talent, approve briefs, and track commissions.</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Pending Payouts</div>
            <div className="text-2xl font-mono font-bold">$14,250</div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <button className="bg-black text-white px-4 py-2 rounded text-sm font-bold">Withdraw</button>
        </div>
      </header>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {AGENCY_ROSTER.map((talent, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-black transition-colors">
            {talent.status === "LATE" && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-2 animate-ping"></div>}
            {talent.status === "LIVE" && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-2 animate-pulse"></div>}
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-400">
                <img src={talent.image} alt={talent.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              </div>
              <div>
                <div className="font-bold text-sm">{talent.name}</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded w-max mt-1 ${
                  talent.status === 'LIVE' ? 'bg-green-100 text-green-700' :
                  talent.status === 'LATE' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-500'
                }`}>{talent.status}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-400">Viewers</div>
                <div className="font-mono font-bold">{talent.viewers}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-400">Timer</div>
                <div className={`font-mono font-bold ${talent.status === 'LATE' ? 'text-red-500' : 'text-black'}`}>
                  {talent.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Brief Approval Queue */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-sm uppercase tracking-wider flex justify-between items-center">
          <span className="flex items-center gap-2"><Bell size={16} /> Contract Requests (3)</span>
          <button className="text-blue-600 text-xs hover:underline">View All</button>
        </div>
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="p-4 md:p-6 border-b border-gray-100 last:border-0 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition gap-4">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><MessageSquare size={18}/></div>
              <div>
                <div className="font-bold text-sm">Samsung Galaxy Launch</div>
                <div className="text-xs text-gray-500">Requested for: <span className="font-medium text-black">Sarah Jenkins</span> • $2,500</div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded text-xs font-bold hover:bg-gray-100">Review</button>
              <button className="flex-1 md:flex-none px-4 py-2 bg-black text-white rounded text-xs font-bold hover:opacity-80">Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. ANALYTICS VIEW (The "Receipt" for Brands)
const AnalyticsView = () => {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-20">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 overflow-x-auto whitespace-nowrap">
          <span>Campaigns</span> / <span>Summer Drop</span> / <span>Sarah Jenkins</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif">Post-Stream Analysis</h2>
      </header>

      {/* Top Level KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Brief Adherence", val: "94%", color: "text-green-600", sub: "Perfect Score" },
          { label: "Retention Rate", val: "14m 20s", color: "text-indigo-600", sub: "+20% vs Avg" },
          { label: "Peak Viewers", val: "15,204", color: "text-black", sub: "@ 08:15 PM" },
          { label: "Conversion Est.", val: "$4,200", color: "text-black", sub: "Based on CTR" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className={`text-3xl font-mono font-bold ${stat.color} mb-1`}>{stat.val}</div>
            <div className="text-xs text-gray-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* The Timeline Graph */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-8 mb-8 shadow-sm overflow-hidden">
        <h3 className="font-bold mb-6">Engagement Timeline</h3>
        
        {/* Fake Graph */}
        <div className="h-64 w-full flex items-end justify-between gap-1 relative border-b border-gray-200">
          {[40, 45, 60, 55, 70, 85, 90, 100, 80, 60, 50, 40, 55, 65, 75, 95, 85, 70, 60, 50].map((h, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0 }} 
              animate={{ height: `${h}%` }} 
              transition={{ delay: i * 0.05 }}
              className={`w-full rounded-t-sm opacity-80 ${i === 7 || i === 15 ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          ))}
          
          {/* Timeline Annotations */}
          <div className="absolute top-10 left-[35%] bg-black text-white text-[9px] md:text-[10px] px-2 py-1 rounded shadow-lg transform -translate-x-1/2 flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" /> <span className="hidden md:inline">Trivia Game Start</span>
          </div>
          <div className="absolute top-4 left-[75%] bg-black text-white text-[9px] md:text-[10px] px-2 py-1 rounded shadow-lg transform -translate-x-1/2 flex items-center gap-1">
            <DollarSign size={10} className="text-green-400" /> <span className="hidden md:inline">Peak</span>
          </div>
        </div>
      </div>

      {/* Transcription / Adherence Audit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Mic2 size={16} /> Key Message Audit
          </h3>
          <div className="space-y-4">
            {[
              { phrase: "Mention 'Sustainable Packaging'", status: "success", time: "04:12" },
              { phrase: "Show the 'Side Pocket'", status: "success", time: "09:30" },
              { phrase: "Use Discount Code 'LIVE20'", status: "success", time: "14:50" },
              { phrase: "Ask to Follow Account", status: "warning", time: "Missed" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="truncate mr-2">{item.phrase}</span>
                {item.status === 'success' ? (
                  <span className="flex-none flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={12}/> Verified</span>
                ) : (
                  <span className="flex-none flex items-center gap-1 text-yellow-600 text-xs font-bold">Missed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-900 text-white rounded-xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[200px]">
           <div className="relative z-10">
             <h3 className="font-bold mb-2 text-xl">Unlock Full Intelligence</h3>
             <p className="text-indigo-200 text-sm mb-6 leading-relaxed">Upgrade to On Cue Pro to see individual viewer sentiment analysis, click-through heatmaps, and competitor benchmarking.</p>
             <button className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold text-sm hover:bg-indigo-50 transition w-full md:w-auto">Upgrade Plan</button>
           </div>
           <div className="absolute -right-10 -bottom-10 opacity-10">
             <BarChart3 size={200} />
           </div>
        </div>
      </div>
    </div>
  );
};

// 6. CREATOR DASHBOARD (The "Home" for Talent)
const CreatorDashboard = ({ onEnterStudio }: { onEnterStudio: () => void }) => {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen pb-20">
      {/* Header Profile */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
             <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
             <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-2 py-1 rounded-full border-2 border-white font-bold flex items-center gap-1">
               <ShieldCheck size={12} /> PRO
             </div>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif">Sarah Jenkins</h2>
            <p className="text-gray-500 text-sm md:text-base">Fashion & Lifestyle • Level 4 Creator</p>
            <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-sm font-medium">
               <span className="text-green-600 bg-green-50 px-2 py-1 rounded">98% Reliability</span>
               <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">14m Avg Retention</span>
            </div>
          </div>
        </div>
        <div className="bg-black text-white p-5 rounded-xl shadow-xl w-full md:w-auto min-w-[200px]">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Available Balance</div>
          <div className="text-3xl font-mono font-bold">$4,250</div>
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1"><Activity size={12}/> +$1,200 this week</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: UPCOMING GIGS */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={18} /> Upcoming Bookings</h3>
          
          {/* Active Job Card */}
          <div className="bg-white border border-black rounded-xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
               <div>
                 <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block animate-pulse">Happening Soon</span>
                 <h4 className="text-xl font-bold">Samsung Galaxy Launch</h4>
                 <p className="text-gray-500 text-sm">Friday, 24 Oct • 08:00 PM - 09:00 PM</p>
               </div>
               <div className="text-left md:text-right mt-2 md:mt-0">
                 <div className="font-mono font-bold text-lg">$2,500</div>
                 <div className="text-xs text-gray-400">Base Fee</div>
               </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
               <div className="text-xs text-gray-500 uppercase mb-2 font-bold">Brief Snapshot</div>
               <ul className="text-sm space-y-2 text-gray-700">
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Mention "AI Camera Features"</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Run Trivia Game (10 mins)</li>
                 <li className="flex items-center gap-2"><CheckCircle size={14} className="text-gray-300"/> Drop Discount Code</li>
               </ul>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button 
                onClick={onEnterStudio}
                className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2"
              >
                <LayoutTemplate size={18} /> Enter Studio Mode
              </button>
              <button className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold text-gray-600">
                View Full Brief
              </button>
            </div>
          </div>

          {/* Pending Job */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 opacity-75 hover:opacity-100 transition">
             <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-gray-800">Nike Summer Drop</h4>
               <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold">Request Pending</span>
             </div>
             <p className="text-sm text-gray-500 mb-4">Saturday, 25 Oct • 10:00 AM</p>
             <div className="flex gap-2">
                <button className="text-sm bg-black text-white px-4 py-2 rounded font-bold flex-1">Accept ($1,200)</button>
                <button className="text-sm border border-gray-300 px-4 py-2 rounded font-bold text-gray-500 flex-1">Decline</button>
             </div>
          </div>
        </div>

        {/* RIGHT COL: PERFORMANCE STATS */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 size={18} /> Performance Score</h3>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="inline-block p-4 rounded-full border-4 border-green-500 text-3xl font-bold font-mono text-green-600 mb-2">
                9.4
              </div>
              <div className="text-sm font-bold text-gray-800">Excellent Standing</div>
              <p className="text-xs text-gray-400">Top 5% of Creators this week</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Punctuality</span>
                  <span className="text-green-600">100%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Script Adherence</span>
                  <span className="text-green-600">92%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[92%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Audience Sentiment</span>
                  <span className="text-yellow-500">85%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-[85%]"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
               <h5 className="text-xs font-bold uppercase text-gray-400 mb-2">Recent Achievement</h5>
               <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                 <div className="text-2xl">🏆</div>
                 <div>
                   <div className="text-xs font-bold text-yellow-800">Retention Master</div>
                   <div className="text-[10px] text-yellow-600">Held 10k viewers for &gt;15 mins</div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN WRAPPER ---

export default function ShowrunnerPrototype() {
  const [view, setView] = useState("landing"); 

  // Add styles for hiding scrollbars but keeping functionality
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // 1. THE APP VIEW (Marketplace, Studio, Agency, Dashboard)
  if (view !== "landing") {
    return (
      <div className="min-h-screen bg-gray-50 text-black flex flex-col font-sans">
        
        {/* --- ADD BADGE HERE --- */}
        <MockupBadge />
        
        {/* Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="font-bold tracking-tight text-xl cursor-pointer w-full md:w-auto text-center md:text-left" onClick={() => setView("landing")}>ON CUE</div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">
            <button 
              onClick={() => setView("marketplace")}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'marketplace' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Search size={14} /> Brands
            </button>
            <button 
              onClick={() => setView("agency")}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'agency' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Users size={14} /> Agency
            </button>
            <button 
              onClick={() => setView("analytics")}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'analytics' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <BarChart3 size={14} /> Data
            </button>

            <div className="w-px bg-gray-300 mx-1 flex-none"></div>

            <button 
              onClick={() => setView("creator_dashboard")}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'creator_dashboard' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LayoutTemplate size={14} /> Dashboard
            </button>
            <button 
              onClick={() => setView("studio")}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'studio' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Zap size={14} /> Studio
            </button>
          </div>

          <div className="w-8 h-8 bg-gray-200 rounded-full hidden md:block"></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50">
          <AnimatePresence mode="wait">
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {view === "marketplace" && <Marketplace />}
              {view === "studio" && <StudioApp />}
              {view === "agency" && <AgencyPortal />}
              {view === "analytics" && <AnalyticsView />}
              {view === "creator_dashboard" && <CreatorDashboard onEnterStudio={() => setView("studio")} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 2. THE LANDING PAGE VIEW
  return (
    <>
      {/* --- ADD BADGE HERE --- */}
      <MockupBadge />
      
      <LandingPage 
        onGetStarted={() => setView("marketplace")} 
        onCreatorClick={() => setView("creator_dashboard")} 
      />
    </>
  );
}