"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Zap, PlayCircle, ShieldCheck } from "lucide-react";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabaseClient"; 

export default function HomePage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH REAL DATA ---
  useEffect(() => {
    const fetchTalent = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_featured', true) // <--- ONLY SHOW FEATURED
        .eq('role', 'creator');

      if (data) {
        setInfluencers(data);
      }
      setLoading(false);
    };

    fetchTalent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION (Small & Punchy) */}
      <div className="bg-black text-white pt-20 pb-16 px-4 text-center rounded-b-[3rem] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-[10px] tracking-widest uppercase mb-4"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live Now
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6 tracking-tight">
            The Marketplace for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Live Commerce Talent.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Find vetted hosts for your next live stream. 
            Professional equipment, high retention, ready to go live.
          </p>
          
          {/* Search Bar Visual */}
          <div className="bg-white p-2 rounded-full max-w-md mx-auto flex items-center shadow-2xl">
            <Search className="text-gray-400 ml-4" size={20} />
            <input 
              type="text" 
              placeholder="Try 'Tech Reviewer' or 'Fashion Host'..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-black px-4 outline-none"
            />
            <button className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition">Search</button>
          </div>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900 to-black opacity-50 z-0"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-red-600/30 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* 2. THE MARKETPLACE GRID */}
<div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">Featured Talent</h2>
            <p className="text-gray-500">Highest retention rates this week.</p>
          </div>
          <Link href="/marketplace">
            <button className="text-sm font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition">View All Categories</button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading Talent...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {influencers.map((inf) => (
              <Link href={`/marketplace/${inf.id}`} key={inf.id} className="group block h-full">
                <motion.div 
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 flex flex-col"
                >
                  {/* Image Card */}
                  <div className="relative h-72 bg-gray-200 overflow-hidden">
                    <img 
                        // Fallback to avatar if card_image is missing
                        src={inf.card_image_url || inf.avatar_url} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        alt={inf.name}
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Zap size={10} className="text-yellow-500 fill-yellow-500" /> 
                      {inf.category}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-red-600 transition-colors">{inf.name}</h3>
                      <span className="text-sm font-mono font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">{inf.price_rate}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-6">{inf.handle} • {inf.location || "Global"}</p>
                    
                    {/* Stats Row */}
                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Avg Retention</div>
                        <div className="font-mono font-bold text-indigo-600 text-sm">{inf.retention_rate}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Reliability</div>
                          <div className="font-mono font-bold text-green-600 text-sm">{inf.reliability_score}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}