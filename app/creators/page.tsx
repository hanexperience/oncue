"use client";
import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { 
  Zap, Shield, TrendingUp, Lock, 
  ArrowRight, DollarSign, Star 
} from "lucide-react";

export default function CreatorLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-yellow-500/30">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* SCARCITY BADGE */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-red-500/30 bg-red-900/10 text-red-400 text-xs font-bold tracking-widest uppercase">
            <Lock size={12} />
            Private Beta • Invite Only
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 leading-tight">
            Turn your <span className="text-zinc-500">Live Stream</span> <br/>
            into a <span className="text-white">Live Career.</span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            On Cue is the premiere roster for professional live hosts. <br/>
            <span className="text-white font-medium">Guaranteed Base Pay. Performance Bonuses. No Agency Fees.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/onboarding?role=creator">
              <button className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-2">
                Apply for Access <ArrowRight size={20} />
              </button>
            </Link>
            <div className="text-sm text-zinc-500 font-medium">
              Due to demand, approval takes ~48h.
            </div>
          </div>
        </div>
      </div>

      {/* --- PLATFORM ECOSYSTEM (Option 1) --- */}
      <div className="border-y border-white/5 bg-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
             <p className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-8">
                Works with your existing audience on
             </p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-24 opacity-60 text-white">
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter hover:opacity-100 transition-opacity cursor-default">
                    TikTok <span className="font-light">Live</span>
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter hover:opacity-100 transition-opacity cursor-default">
                    Instagram <span className="font-light">Live</span>
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter hover:opacity-100 transition-opacity cursor-default">
                    Twitch
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter hover:opacity-100 transition-opacity cursor-default">
                    YouTube <span className="font-light">Shorts</span>
                  </span>
             </div>
        </div>
      </div>

      {/* --- THE "FOMO" MANIFESTO --- */}
      <div className="py-24 px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
            We are not an open directory.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            Most marketplaces let anyone with an account join. We don't. <br/>
            On Cue is curating the top 1% of live talent who understand that <strong>Live Streaming is a Performance</strong>, not just a hobby.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="text-yellow-500 font-bold mb-2 flex items-center gap-2"><Star size={16}/> The Performer</div>
                  <p className="text-sm text-zinc-400">You don't just sit there. You have energy, wit, and the ability to hold a room.</p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="text-yellow-500 font-bold mb-2 flex items-center gap-2"><Lock size={16}/> The Professional</div>
                  <p className="text-sm text-zinc-400">You show up on time. You have good lighting. You treat this like a business.</p>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="text-yellow-500 font-bold mb-2 flex items-center gap-2"><TrendingUp size={16}/> The Specialist</div>
                  <p className="text-sm text-zinc-400">You are an expert in a specific niche (Fashion, Tech, Beauty), not a generalist.</p>
              </div>
          </div>
      </div>

      {/* --- VALUE PROPS --- */}
      <div className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
                <div className="w-14 h-14 bg-green-900/20 text-green-400 rounded-2xl flex items-center justify-center mb-6">
                    <DollarSign size={28} />
                </div>
                <h3 className="text-2xl font-serif font-bold mb-3">Keep 100% of your Base.</h3>
                <p className="text-zinc-400 leading-relaxed">
                    We aren't an agency that takes a 20% cut. We charge the brand a service fee on top of your rate.
                </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
                <div className="w-14 h-14 bg-blue-900/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                    <Shield size={28} />
                </div>
                <h3 className="text-2xl font-serif font-bold mb-3">Escrow Protection.</h3>
                <p className="text-zinc-400 leading-relaxed">
                    Never get ghosted again. Brands must deposit the full payment into Escrow before you go live.
                </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
                <div className="w-14 h-14 bg-purple-900/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                    <Zap size={28} />
                </div>
                <h3 className="text-2xl font-serif font-bold mb-3">Instant Payouts.</h3>
                <p className="text-zinc-400 leading-relaxed">
                    Once our AI verifies your stream metrics, funds can be released to your wallet in as little as 24 hours.
                </p>
            </div>
        </div>
      </div>

      {/* --- CTA FOOTER --- */}
      <div className="py-20 text-center border-t border-zinc-800 bg-zinc-950">
         <h2 className="text-4xl md:text-5xl font-serif font-medium mb-8">Do you make the cut?</h2>
         <Link href="/onboarding?role=creator">
            <button className="px-12 py-6 bg-white text-black rounded-full font-bold text-xl hover:bg-yellow-400 transition-colors">
                Apply for Private Beta
            </button>
         </Link>
         <p className="mt-6 text-zinc-500 text-sm">Limited spots available for Q1 2026.</p>
      </div>

    </div>
  );
}