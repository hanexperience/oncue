"use client";
import React from "react";
import { motion } from "framer-motion";
import { Zap, DollarSign, Mic2, CheckCircle, BarChart3 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />

      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-20">
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
          
          {/* Animated Graph */}
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
    </div>
  );
}