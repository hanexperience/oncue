"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, SlidersHorizontal, Search } from "lucide-react";
import Navbar from "../components/Navbar"; 
import { supabase } from "../lib/supabaseClient";

export default function Marketplace() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // Fetch Real Data from Supabase
  useEffect(() => {
    const fetchCreators = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator')
        .eq('is_featured', true); // Only show approved/featured creators

      if (error) console.error("Error fetching:", error);
      if (data) setCreators(data);
      setLoading(false);
    };

    fetchCreators();
  }, []);

  // Simple Category Filter Logic
  const filteredCreators = filter === "All" 
    ? creators 
    : creators.filter(c => c.category === filter);

  const categories = ["All", "Fashion", "Tech", "Beauty", "Home", "Fitness"];

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">Find your host.</h1>
            <p className="text-gray-500 max-w-lg text-lg">
              Browse vetted professionals with verified studio setups and sales data.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col items-end gap-4 w-full md:w-auto">
             {/* Search */}
             <div className="relative w-full md:w-80">
               <Search className="absolute top-3 left-3 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by name or keyword..." 
                 className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-black transition"
               />
             </div>
             
             {/* Category Pills */}
             <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === cat ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}
                  >
                    {cat}
                  </button>
                ))}
                <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-black flex items-center gap-2">
                  <SlidersHorizontal size={14} /> Filters
                </button>
             </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredCreators.length === 0 ? (
               <div className="col-span-4 text-center py-20 text-gray-400">No creators found in this category.</div>
            ) : (
              filteredCreators.map((inf) => (
                <Link href={`/marketplace/${inf.id}`} key={inf.id} className="group block h-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-80 bg-gray-200 overflow-hidden">
                      <img 
                        src={inf.card_image_url || inf.avatar_url || "https://via.placeholder.com/400"} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={inf.name}
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Zap size={10} className="text-yellow-500 fill-yellow-500" /> 
                        {inf.category}
                      </div>
                      
                      {/* Hover Overlay Button */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white text-black font-bold px-6 py-3 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
                           View Profile
                         </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg group-hover:text-red-600 transition-colors">{inf.name}</h3>
                        <span className="text-sm font-mono font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">{inf.price_rate}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-6">{inf.handle}</p>
                      
                      <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Retention</div>
                          <div className="font-mono font-bold text-indigo-600">{inf.retention_rate}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                           <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Reliability</div>
                           <div className="font-mono font-bold text-green-600">{inf.reliability_score}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}