"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import Navbar from "../components/Navbar"; 
import { RUN_OF_SHOW } from "../lib/data"; // Import shared data
import { useBooking } from "../context/BookingContext";

export default function StudioPage() {
  const [activeSegment, setActiveSegment] = useState(1);
  const [timeLeft, setTimeLeft] = useState(599); 
  const [chatLog, setChatLog] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { prompterMessage } = useBooking();

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
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />
      
      <div className="flex-1 p-4 md:p-8 flex flex-col md:flex-row gap-6 md:overflow-hidden overflow-y-auto pb-20 max-w-[1600px] mx-auto w-full">
        {/* LEFT: The HUD */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6">
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

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-48">
            <div className="flex-1 bg-gray-800 rounded-2xl p-6 border-l-4 border-blue-500 shadow-lg shadow-blue-500/10 flex flex-col justify-center min-h-[150px]">
                <div className="flex justify-between mb-2">
                    <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} /> Brand Director
                    </h3>
                    <span className="text-gray-500 text-xs">Live Update</span>
                </div>
                
                {/* ANIMATED MESSAGE */}
                <motion.p 
                    key={prompterMessage} // This forces the animation to restart when text changes
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg md:text-2xl font-medium leading-relaxed"
                >
                    "{prompterMessage}"
                </motion.p>
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
    </div>
  );
}