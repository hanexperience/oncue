"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Calendar } from "lucide-react";
import Navbar from "../components/Navbar"; // Importing the shared component
import { INFLUENCERS } from "../lib/data"; // Importing shared data
import { useBooking } from "../context/BookingContext";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function Marketplace() {
  const { addBooking } = useBooking();
  const { user } = useUser(); // Check if user exists
  const { openSignIn } = useClerk(); // Function to open login modal

const handleBook = (id: string | number, name: string, price: string) => {
  if (!user) {
    openSignIn({ afterSignInUrl: '/marketplace' });
    return;
  }
  
  // Ensure we pass a string to addBooking
  addBooking(id.toString(), price, name); 
  alert(`Request sent to ${name}! Check your Agency Portal.`);
};

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
        <header className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-serif mb-2">Talent Discovery</h2>
          <p className="text-sm md:text-base text-gray-500">Find certified live broadcasters based on retention & brief adherence.</p>
        </header>

        {/* Filters */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          {["All Talent", "High Retention", "Tech", "Fashion", "Food", "Certified Pro"].map((filter, i) => (
            <button key={i} className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${i === 0 ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'}`}>
              {filter}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INFLUENCERS.map((inf) => (
            <motion.div 
              key={inf.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="h-48 relative p-4 flex flex-col justify-between overflow-hidden">
                <img src={inf.image} alt={inf.name} className="absolute inset-0 w-full h-full object-cover z-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 z-10"></div>
                <div className="flex justify-between items-start relative z-20">
                    {inf.live ? (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase animate-pulse shadow-lg">Live Now</span>
                    ) : (
                      <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Offline</span>
                    )}
                    <span className="bg-white/20 backdrop-blur text-white p-1 rounded-full"><ShieldCheck size={14} /></span>
                </div>
                <div className="text-white font-bold text-lg relative z-20">{inf.name}</div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-gray-500">{inf.handle}</div>
                  <div className="text-sm font-bold">{inf.price}<span className="text-gray-400 font-normal text-xs">/hr</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Retention</div>
                    <div className="font-mono font-bold text-indigo-600">{inf.retention}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Adherence</div>
                    <div className="font-mono font-bold text-green-600">{inf.reliability}</div>
                  </div>
                </div>
        <Link href={`/marketplace/${inf.id}`}>
                <button 
                  className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold group-hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  View Profile
                </button>
              </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}