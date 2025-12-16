"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Zap, ShieldCheck } from "lucide-react";
import Navbar from "./components/Navbar";
import { INFLUENCERS } from "./lib/data";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-100">
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
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold">Featured Talent</h2>
          <div className="text-sm text-gray-500 cursor-pointer hover:text-black underline">View All Categories</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INFLUENCERS.map((inf) => (
             <Link href={`/marketplace/${inf.id}`} key={inf.id} className="group">
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
               >
                 {/* Image */}
                 <div className="relative h-64 bg-gray-200">
                   <img src={inf.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                     <Zap size={10} className="text-yellow-500 fill-yellow-500" /> 
                     {inf.category}
                   </div>
                 </div>

                 {/* Info */}
                 <div className="p-5">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg">{inf.name}</h3>
                     <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{inf.price}</span>
                   </div>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">{inf.handle} • Melbourne, AU</p>
                   
                   {/* Metrics */}
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-gray-50 p-2 rounded text-center">
                       <div className="text-gray-400 text-[10px] uppercase">Retention</div>
                       <div className="font-bold text-indigo-600">{inf.retention}</div>
                     </div>
                     <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-gray-400 text-[10px] uppercase">Reliability</div>
                        <div className="font-bold text-green-600">{inf.reliability}</div>
                     </div>
                   </div>
                 </div>
               </motion.div>
             </Link>
          ))}
        </div>
      </div>
    </div>
  );
}