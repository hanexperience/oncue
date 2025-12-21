"use client";
import React, { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { 
  Target, ShieldCheck, BarChart3, Lock, 
  ArrowRight, Briefcase, Layers, Users, X, Mail
} from "lucide-react";

export default function BrandLandingPage() {
  const [view, setView] = useState<'brand' | 'agency'>('brand');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-100 relative">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-12 px-6 overflow-hidden border-b border-gray-100">
        
        {/* TOGGLE SWITCH */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-100 p-1.5 rounded-full flex relative border border-gray-200">
             <button 
               onClick={() => setView('brand')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${view === 'brand' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Target size={16} /> I am a Brand
             </button>
             <button 
               onClick={() => setView('agency')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${view === 'agency' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               <Briefcase size={16} /> I am an Agency
             </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in zoom-in-95 duration-500" key={view}>
          {/* SCARCITY BADGE */}
          <div className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-bold tracking-widest uppercase ${view === 'brand' ? 'border-red-100 bg-red-50 text-red-600' : 'border-blue-100 bg-blue-50 text-blue-600'}`}>
            <Lock size={12} />
            {view === 'brand' ? 'Invitation Only • Private Beta' : 'Partner Program • Waitlist Active'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 leading-tight">
            {view === 'brand' ? (
                <>Stop managing chaos. <br/><span className="text-gray-400">Start booking results.</span></>
            ) : (
                <>Scale your <span className="text-gray-400">Live Service</span> <br/>without the headcount.</>
            )}
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {view === 'brand' 
              ? "The operating system for professional live commerce. We are currently accepting 5 new brands per month to ensure quality."
              : "Manage 50+ influencer campaigns with a single dashboard. Apply now to join our certified agency partner program."
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* UPDATED BUTTON: Triggers Modal */}
            <button 
              onClick={() => setShowModal(true)}
              className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 hover:scale-105 transition-all shadow-xl flex items-center gap-2"
            >
               <Lock size={18} /> {view === 'brand' ? 'Request Access' : 'Apply for Partner API'}
            </button>

            <div className="text-sm text-gray-400 font-medium">
              {view === 'brand' ? 'Already have an invite? Log in.' : 'Volume discounts available.'}
            </div>
          </div>
        </div>
      </div>

      {/* --- INTEGRATION ECOSYSTEM --- */}
      <div className="py-10 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
             <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-8">
                {view === 'brand' ? 'Platforms supported' : 'Integrates with your stack'}
             </p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-24 opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default">
                    TikTok <span className="font-light">Live</span>
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default">
                    Instagram <span className="font-light">Live</span>
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default">
                    Twitch
                  </span>
                  <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default">
                    YouTube <span className="font-light">Live</span>
                  </span>
             </div>
        </div>
      </div>

      {/* --- SPLIT CONTENT SECTIONS --- */}
      <div className="py-24 px-6 max-w-7xl mx-auto">
         {/* === BRAND VIEW: SAFETY & ROI === */}
        {view === 'brand' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">Why Brands choose On Cue</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6"><Target size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">Control the Message.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Use our <strong>Prompter™</strong> app to script the show. If talent misses a key talking point, you don't pay full price.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">Brand Safety First.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Every host is vetted for internet speed, lighting, and professionalism. No more PR disasters from unmoderated live streams.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6"><BarChart3 size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">Transparent ROI.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Stop paying for "Awareness." Our CPEM model means you pay bonuses only when customers are actually watching and engaging.
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* === AGENCY VIEW: SCALE & MARGIN === */}
        {view === 'agency' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">The Infrastructure for Agencies</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><Layers size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">One Dashboard.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Manage 50 concurrent live streams across 10 different clients. Centralized billing, centralized reporting, centralized stress.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6"><Briefcase size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">Whitelabel Reports.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Export beautiful, branded PDF reports for your clients instantly. Prove your ROI without spending hours in Excel.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6"><Users size={28} /></div>
                        <h3 className="text-2xl font-serif font-bold mb-3">Bring Your Roster.</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Onboard your existing influencers into our OS. Use our tools to manage them more effectively, with 0% fees on internal talent.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- CTA FOOTER --- */}
      <div className="py-20 text-center bg-black text-white">
         <h2 className="text-4xl md:text-5xl font-serif font-medium mb-8">
             {view === 'brand' ? 'Join the waitlist.' : 'Scale your agency.'}
         </h2>
         <button 
           onClick={() => setShowModal(true)}
           className="px-12 py-6 bg-white text-black rounded-full font-bold text-xl hover:bg-gray-200 transition-colors shadow-2xl"
         >
             Request Invitation
         </button>
         <p className="mt-6 text-gray-500 text-sm">We process new applications every Friday.</p>
      </div>

      {/* --- EXCLUSIVE ACCESS MODAL (NEW) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
             <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
             
             <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Lock size={32} />
             </div>
             
             <h3 className="text-3xl font-serif font-bold text-center mb-2">Private Access</h3>
             <p className="text-gray-500 text-center mb-8 leading-relaxed">
                We are currently processing a high volume of applications. Please contact our partnerships team directly to skip the queue.
             </p>
             
             <a href="mailto:partnerships@oncue.com?subject=Requesting%20Brand%20Access" className="block w-full">
                <button className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                   <Mail size={18} /> Email Partnerships
                </button>
             </a>
             
             <p className="text-xs text-center text-gray-400 mt-4">
                Waitlist position: #4,219
             </p>
          </div>
        </div>
      )}

    </div>
  );
}