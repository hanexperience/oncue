"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { motion } from "framer-motion";
import { Search, Zap, User } from "lucide-react"; 
import Navbar from "./components/Navbar"; 
import { supabase } from "./lib/supabaseClient"; 

export default function HomePage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // --- FETCH REAL DATA ---
  useEffect(() => {
    const fetchTalent = async () => {
      // Fetch featured creators
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_featured', true) 
        .eq('role', 'creator');

      if (data) {
        setInfluencers(data);
      }
      setLoading(false);
    };

    fetchTalent();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <div className="bg-black text-white pt-32 pb-20 px-4 text-center rounded-b-[3rem] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-[10px] tracking-widest uppercase mb-4"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live Now
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6 tracking-tight leading-tight">
            The Marketplace for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Live Commerce Talent.</span>
          </h1>
          
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Find vetted hosts for your next live stream. 
            Professional equipment, high retention, ready to go live.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-full max-w-md mx-auto flex items-center shadow-2xl relative z-20">
            <Search className="text-gray-400 ml-4" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try 'Tech Reviewer' or 'Fashion Host'..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-black px-4 outline-none placeholder:text-gray-400"
            />
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition duration-200">
                Search
            </button>
          </form>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"/>)}
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
              No featured talent found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {influencers.map((inf) => (
              <Link 
                 href={`/marketplace/${inf.handle || inf.id}`} 
                 key={inf.id} 
                 className="group block h-full"
              >
                <motion.div 
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 flex flex-col"
                >
                  {/* Image Card */}
                  <div className="relative h-80 bg-gray-200 overflow-hidden">
                    {inf.avatar_url || inf.cover_photos?.[0] ? (
                        // 1. UPDATED: Prioritize Avatar URL
                        <img 
                            src={inf.avatar_url || inf.cover_photos?.[0]} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            alt={inf.name}
                        />
                    ) : (
                        // Fallback if no images exist
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                            <User size={64} />
                        </div>
                    )}
                    
                    {/* Category / Niche Badge */}
                    {inf.niches && inf.niches.length > 0 && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                           <Zap size={10} className="text-yellow-500 fill-yellow-500" /> 
                           {inf.niches[0]}
                        </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-red-600 transition-colors line-clamp-1">{inf.name}</h3>
                      {inf.price_rate && (
                          <span className="text-sm font-mono font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">${inf.price_rate}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-6 truncate">@{inf.handle} • {inf.location || "Global"}</p>
                    
                    {/* Stats Row */}
                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Avg Retention</div>
                        <div className="font-mono font-bold text-indigo-600 text-sm">{inf.retention_rate || "N/A"}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Reliability</div>
                          <div className="font-mono font-bold text-green-600 text-sm">{inf.reliability_score || "100%"}</div>
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