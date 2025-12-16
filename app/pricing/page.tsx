"use client";
import React from "react";
import Link from "next/link";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-100">
      <Navbar />

      {/* --- HERO --- */}
      <div className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full">
          Transparent Pricing
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 leading-tight">
          Start for free. <br />
          <span className="text-gray-400">Scale with volume.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          No monthly fees to get started. We only make money when you successfully book a show.
        </p>
      </div>

      {/* --- PRICING CARDS --- */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* TIER 1: PAY AS YOU GO */}
          <div className="p-8 rounded-3xl border border-gray-200 bg-white flex flex-col hover:shadow-xl transition-shadow duration-300">
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Starter</div>
            <div className="mb-2">
               <span className="text-4xl font-serif font-bold">$0</span>
               <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">Perfect for brands testing live commerce.</p>
            
            <div className="flex-1 space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-green-600 mt-0.5" /> 
                <span>Access to full Talent Marketplace</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-green-600 mt-0.5" /> 
                <span>Standard Escrow Protection</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-green-600 mt-0.5" /> 
                <span>10% Service Fee per booking</span>
              </li>
            </div>

            <Link href="/onboarding?role=brand">
              <button className="w-full py-4 rounded-xl border-2 border-black font-bold hover:bg-black hover:text-white transition-colors">
                Join for Free
              </button>
            </Link>
          </div>

          {/* TIER 2: PRO (Recommended) */}
          <div className="p-8 rounded-3xl border border-black bg-black text-white flex flex-col relative transform md:-translate-y-4 shadow-2xl">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-widest">
              Most Popular
            </div>
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Growth</div>
            <div className="mb-2">
               <span className="text-4xl font-serif font-bold">$299</span>
               <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">For agencies running weekly shows.</p>
            
            <div className="flex-1 space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div>
                <span><strong>Reduced 5% Service Fee</strong></span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div>
                <span>Full "Data" Tab Analytics</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div>
                <span>Priority Talent Booking</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check size={12} className="text-white" /></div>
                <span>Dedicated Account Manager</span>
              </li>
            </div>

            <Link href="/onboarding?role=brand">
              <button className="w-full py-4 rounded-xl bg-white text-black font-bold hover:scale-[1.02] transition-transform">
                Start Pro Trial
              </button>
            </Link>
          </div>

          {/* TIER 3: ENTERPRISE */}
          <div className="p-8 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col hover:shadow-xl transition-shadow duration-300">
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Enterprise</div>
            <div className="mb-2">
               <span className="text-4xl font-serif font-bold">Custom</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">Volume discounts & API access.</p>
            
            <div className="flex-1 space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-gray-400 mt-0.5" /> 
                <span>0% Service Fees</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-gray-400 mt-0.5" /> 
                <span>Custom API Integrations</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="text-gray-400 mt-0.5" /> 
                <span>White-label Director Console</span>
              </li>
            </div>

            <button className="w-full py-4 rounded-xl border border-gray-300 font-bold hover:border-black transition-colors">
              Contact Sales
            </button>
          </div>

        </div>

        {/* --- FAQ SECTION --- */}
        <div className="mt-32 max-w-3xl mx-auto">
           <h2 className="text-3xl font-serif font-bold mb-8 text-center">Frequently Asked Questions</h2>
           <div className="space-y-4">
             {[
               { q: "How are creators vetted?", a: "Every creator undergoes a live connection test to verify upload speeds, lighting quality, and audio setup before joining the roster." },
               { q: "What happens if a creator cancels?", a: "Your funds are held in escrow. If a creator cancels, you are refunded immediately, and we help you find a replacement." },
               { q: "Can I bring my own talent?", a: "Yes. Use our 'Enterprise' plan to onboard your existing roster onto our operating system." }
             ].map((faq, i) => (
               <div key={i} className="border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition">
                 <h3 className="font-bold flex items-center gap-2 mb-2"><HelpCircle size={16} className="text-gray-400"/> {faq.q}</h3>
                 <p className="text-sm text-gray-500 pl-6">{faq.a}</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}