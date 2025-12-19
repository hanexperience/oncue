"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Check, HelpCircle, ArrowRight, TrendingUp, Shield, Zap, Building2, User } from "lucide-react";
import Navbar from "../components/Navbar";

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<'brand' | 'creator'>('brand');
  const [isCreator, setIsCreator] = useState(false);

  // --- CHECK ROLE ON LOAD ---
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If they are a creator, force the view to 'creator' and flag it
      if (data?.role === 'creator') {
        setRole('creator');
        setIsCreator(true);
      }
    };

    if (isLoaded) {
      checkUserRole();
    }
  }, [user, isLoaded]);

  const faqs = {
    brand: [
      { q: "What happens if a creator cancels?", a: "Your funds are held in escrow. If a creator cancels, you are refunded immediately, and we help you find a replacement." },
      { q: "Can I bring my own talent?", a: "Yes. Use our 'Enterprise' plan to onboard your existing roster onto our operating system for better management." },
      { q: "Do you guarantee sales?", a: "We guarantee the 'Experience' (punctuality, brief adherence). While we can't guarantee sales, our metrics correlate high engagement with conversion." }
    ],
    creator: [
      { q: "How is 'Engagement Minute' calculated?", a: "We sync directly with the platform API (TikTok/Twitch) to verify concurrent viewers every 60 seconds." },
      { q: "When do I get paid?", a: "Funds are released to your wallet 24 hours after the stream is successfully verified by our monitoring system." },
      { q: "Do I need a professional studio?", a: "You need 'Verified Tech' status. This means clear audio, good lighting, and >20Mbps upload speed. We test this during onboarding." }
    ]
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${role === 'brand' ? 'bg-white text-black selection:bg-red-100' : 'bg-zinc-950 text-white selection:bg-yellow-900'}`}>
      <Navbar />

      <div className="pt-28 pb-12 px-6">
        
        {/* --- TOGGLE SWITCH (Hidden if user is a known Creator) --- */}
        {!isCreator && (
          <div className="flex justify-center mb-12 animate-in fade-in zoom-in duration-500">
            <div className="bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-full flex relative border border-gray-300/50">
              <button 
                onClick={() => setRole('brand')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${role === 'brand' ? 'bg-white text-black shadow-md scale-105' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Building2 size={16} /> I am a Brand
              </button>
              <button 
                onClick={() => setRole('creator')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${role === 'creator' ? 'bg-zinc-800 text-white shadow-md scale-105' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <User size={16} /> I am a Creator
              </button>
            </div>
          </div>
        )}

        {/* --- DYNAMIC HERO --- */}
        <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500" key={role}>
          <div className={`inline-block mb-4 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full ${role === 'brand' ? 'text-red-600 bg-red-50' : 'text-yellow-500 bg-yellow-900/20'}`}>
            {role === 'brand' ? 'Transparent Pricing' : 'Performance Earnings'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 leading-tight">
            {role === 'brand' ? (
              <>Start for free. <br /><span className="text-gray-400">Scale with volume.</span></>
            ) : (
              <>Stop charging for time. <br /><span className="text-zinc-500">Earn for <span className="text-yellow-500">impact.</span></span></>
            )}
          </h1>
          
          <p className={`text-xl max-w-2xl mx-auto ${role === 'brand' ? 'text-gray-500' : 'text-zinc-400'}`}>
            {role === 'brand' 
              ? "No monthly fees to get started. We only make money when you successfully book a show."
              : "The 'Flat Fee' is dead. Our Hybrid Model guarantees your base rate while uncapping your upside based on audience retention."
            }
          </p>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        
        {/* =========================================
            VIEW 1: BRAND PRICING
        ========================================= */}
        {role === 'brand' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
              
              {/* TIER 1 */}
              <div className="p-8 rounded-3xl border border-gray-200 bg-white flex flex-col hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Starter</div>
                <div className="mb-2"><span className="text-4xl font-serif font-bold">$0</span><span className="text-gray-400">/mo</span></div>
                <p className="text-gray-500 text-sm mb-8">Perfect for brands testing live commerce.</p>
                <div className="flex-1 space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-green-600 mt-0.5" /> <span>Access to Marketplace</span></li>
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-green-600 mt-0.5" /> <span>Standard Escrow</span></li>
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-green-600 mt-0.5" /> <span>10% Service Fee</span></li>
                </div>
                <Link href="/onboarding?role=brand">
                  <button className="w-full py-4 rounded-xl border-2 border-black font-bold hover:bg-black hover:text-white transition-colors">Join for Free</button>
                </Link>
              </div>

              {/* TIER 2 */}
              <div className="p-8 rounded-3xl border border-black bg-black text-white flex flex-col relative transform md:-translate-y-4 shadow-2xl">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-widest">Popular</div>
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Growth</div>
                <div className="mb-2"><span className="text-4xl font-serif font-bold">$299</span><span className="text-gray-400">/mo</span></div>
                <p className="text-gray-400 text-sm mb-8">For agencies running weekly shows.</p>
                <div className="flex-1 space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm"><div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div><span><strong>Reduced 5% Service Fee</strong></span></li>
                  <li className="flex items-start gap-3 text-sm"><div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div><span>Full "Data" Analytics</span></li>
                  <li className="flex items-start gap-3 text-sm"><div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div><span>Dedicated Manager</span></li>
                </div>
                <Link href="/onboarding?role=brand">
                  <button className="w-full py-4 rounded-xl bg-white text-black font-bold hover:scale-[1.02] transition-transform">Start Pro Trial</button>
                </Link>
              </div>

              {/* TIER 3 */}
              <div className="p-8 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Enterprise</div>
                <div className="mb-2"><span className="text-4xl font-serif font-bold">Custom</span></div>
                <p className="text-gray-500 text-sm mb-8">Volume discounts & API access.</p>
                <div className="flex-1 space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-gray-400 mt-0.5" /> <span>0% Service Fees</span></li>
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-gray-400 mt-0.5" /> <span>Custom API Integrations</span></li>
                  <li className="flex items-start gap-3 text-sm"><Check size={18} className="text-gray-400 mt-0.5" /> <span>Director Console</span></li>
                </div>
                <button className="w-full py-4 rounded-xl border border-gray-300 font-bold hover:border-black transition-colors">Contact Sales</button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            VIEW 2: CREATOR EARNINGS
        ========================================= */}
        {role === 'creator' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              
              {/* 1. BASE */}
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 hover:border-zinc-600 transition-colors">
                 <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mb-6"><Shield size={24} /></div>
                 <h3 className="text-xl font-bold mb-2">1. The Base Fee</h3>
                 <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Guaranteed payment for showing up on time and adhering to the brand brief.</p>
                 <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                   <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Condition</div>
                   <div className="text-sm">95% Brief Adherence Score</div>
                 </div>
              </div>

              {/* 2. RETENTION (CPEM) */}
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 relative overflow-hidden ring-1 ring-yellow-500/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="w-12 h-12 bg-yellow-900/30 text-yellow-400 rounded-full flex items-center justify-center mb-6 relative z-10"><TrendingUp size={24} /></div>
                 <h3 className="text-xl font-bold mb-2 relative z-10">2. Variable Impact</h3>
                 <p className="text-zinc-400 text-sm mb-6 leading-relaxed relative z-10">Earn bonuses for every minute you keep viewers watching (CPEM).</p>
                 <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative z-10">
                   <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Formula</div>
                   <div className="text-sm font-mono text-yellow-500">Avg Viewers × Duration × Rate</div>
                 </div>
              </div>

              {/* 3. UNLOCKS */}
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 hover:border-zinc-600 transition-colors">
                 <div className="w-12 h-12 bg-purple-900/30 text-purple-400 rounded-full flex items-center justify-center mb-6"><Zap size={24} /></div>
                 <h3 className="text-xl font-bold mb-2">3. Hype Unlocks</h3>
                 <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Gamified bonuses for hitting peak concurrency targets or interaction velocity.</p>
                 <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                   <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Example</div>
                   <div className="text-sm">Hit 5k Viewers = <span className="text-green-400">+$500 Bonus</span></div>
                 </div>
              </div>
            </div>

            {/* --- CTA SECTION (Hidden for existing creators) --- */}
            {!isCreator && (
              <div className="text-center mb-32">
                  <Link href="/onboarding?role=creator">
                      <button className="px-10 py-5 bg-white text-black rounded-full font-bold hover:bg-yellow-400 hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center gap-3 mx-auto">
                          Apply to Stream <ArrowRight size={20} />
                      </button>
                  </Link>
                  <p className="mt-4 text-xs text-zinc-600 uppercase tracking-widest">Limited spots available for beta</p>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC FAQ SECTION --- */}
        <div className="max-w-3xl mx-auto border-t border-gray-200/10 pt-20">
           <h2 className="text-3xl font-serif font-bold mb-8 text-center">
             {role === 'brand' ? 'Brand FAQs' : 'Creator FAQs'}
           </h2>
           <div className="space-y-4">
             {faqs[role].map((faq, i) => (
               <div key={i} className={`rounded-2xl p-6 transition ${role === 'brand' ? 'border border-gray-200 hover:bg-gray-50' : 'border border-zinc-800 bg-zinc-900 hover:bg-zinc-800'}`}>
                 <h3 className="font-bold flex items-center gap-2 mb-2">
                    <HelpCircle size={16} className={role === 'brand' ? "text-gray-400" : "text-zinc-500"}/> 
                    {faq.q}
                 </h3>
                 <p className={`text-sm pl-6 ${role === 'brand' ? 'text-gray-500' : 'text-zinc-400'}`}>{faq.a}</p>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}