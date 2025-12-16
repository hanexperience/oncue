"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Calendar, Zap, BarChart3, ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import Navbar from "../components/Navbar";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-100">
      <Navbar />

      {/* --- HERO --- */}
      <div className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full"
        >
          The Process
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 leading-tight">
          From Brief to Broadcast <br />
          <span className="text-gray-400">in four steps.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          We've replaced the chaotic back-and-forth of influencer marketing with a streamlined, professional operating system.
        </p>
      </div>

      {/* --- STEPS CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-32">

        {/* STEP 1: DISCOVER */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <div className="flex-1 order-2 md:order-1">
            <div className="text-red-500 font-bold text-lg mb-2">01. Discovery</div>
            <h2 className="text-4xl font-serif font-bold mb-6">Find talent that actually converts.</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Stop guessing. Filter our roster not just by looks, but by <strong>Retention Rate</strong>, <strong>Reliability Score</strong>, and <strong>Technical Setup</strong>.
            </p>
            <ul className="space-y-3">
              {["Verified Internet Speeds", "Professional Lighting & Audio", "Sales Performance Data"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium">
                  <CheckCircle2 size={18} className="text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <motion.div 
             initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
             className="flex-1 order-1 md:order-2 bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden aspect-square flex items-center justify-center"
          >
             {/* Abstract UI: Profile Cards */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-xl shadow-xl p-4 border border-gray-100 rotate-[-6deg] z-10">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                   <div>
                      <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="w-16 h-2 bg-gray-100 rounded"></div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <div className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded font-bold">98% Reliability</div>
                </div>
             </div>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-xl shadow-sm p-4 border border-gray-100 rotate-[6deg] opacity-50 scale-90"></div>
          </motion.div>
        </div>

        {/* STEP 2: BOOKING */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <motion.div 
             initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
             className="flex-1 bg-black text-white rounded-3xl p-8 border border-gray-800 relative overflow-hidden aspect-square flex flex-col justify-center"
          >
             {/* Abstract UI: Contract */}
             <div className="w-full max-w-sm mx-auto bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                   <div className="text-sm font-bold text-gray-400">CONTRACT #8291</div>
                   <div className="bg-green-900 text-green-400 text-[10px] px-2 py-1 rounded font-bold">SIGNED</div>
                </div>
                <div className="space-y-3 mb-6">
                   <div className="w-full h-2 bg-gray-800 rounded"></div>
                   <div className="w-3/4 h-2 bg-gray-800 rounded"></div>
                   <div className="w-full h-2 bg-gray-800 rounded"></div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                   <div className="text-2xl font-serif">$1,200</div>
                   <div className="text-xs text-gray-500">Escrow Secured</div>
                </div>
             </div>
          </motion.div>
          <div className="flex-1">
            <div className="text-blue-600 font-bold text-lg mb-2">02. The Booking</div>
            <h2 className="text-4xl font-serif font-bold mb-6">Standardized contracts. <br/>Escrow payments.</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              No more DMs. No more chasing invoices. Send a structured brief and booking request. We hold the funds in escrow until the job is done.
            </p>
          </div>
        </div>

        {/* STEP 3: GO LIVE */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <div className="flex-1 order-2 md:order-1">
            <div className="text-yellow-600 font-bold text-lg mb-2">03. Production</div>
            <h2 className="text-4xl font-serif font-bold mb-6">Direct the show <br/> in real-time.</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Our <strong>Live Director Console</strong> connects directly to the talent's teleprompter. Send commands, update pricing, or steer the conversation instantly.
            </p>
            <div className="flex flex-wrap gap-2">
               {["Wrap it up", "Show the shoes", "Mention Discount"].map((cmd, i) => (
                 <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                   "{cmd}"
                 </span>
               ))}
            </div>
          </div>
          <motion.div 
             initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
             className="flex-1 order-1 md:order-2 bg-red-50 rounded-3xl p-8 border border-red-100 relative overflow-hidden aspect-square flex items-center justify-center"
          >
             {/* Abstract UI: Teleprompter Message */}
             <div className="absolute top-0 right-0 p-32 bg-red-500 blur-[100px] opacity-20 rounded-full"></div>
             
             <div className="relative z-10 w-full max-w-xs text-center">
                <div className="mb-4 inline-flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-xs animate-pulse">
                  <Zap size={12} fill="currentColor" /> Live Signal
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-red-500 text-left">
                   <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase">
                     <MessageSquare size={12} /> Director Says:
                   </div>
                   <div className="text-2xl font-medium leading-tight text-black">
                     "There are soome great questions in the chat about the new summer collection. Can you highlight the features?"
                   </div>
                </div>
             </div>
          </motion.div>
        </div>

      </div>

      {/* --- CTA --- */}
      <div className="bg-black text-white py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Ready to modernize your live stream strategy?</h2>
          <Link href="/marketplace">
            <button className="bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3 mx-auto">
              Find Talent Now <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}