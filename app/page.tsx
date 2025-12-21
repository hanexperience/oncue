"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { motion } from "framer-motion";
import { 
  CheckCircle, Wifi, Star, ShieldCheck, Sliders, MonitorPlay, 
  Search, Zap, User // Kept these imports for the future grid/search
} from "lucide-react"; 
import Navbar from "./components/Navbar"; 
import { supabase } from "./lib/supabaseClient"; 

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- FUTURE PROOFING: DATA STATE ---
  /* const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalent = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_featured', true) 
        .eq('role', 'creator');

      if (data) setInfluencers(data);
      setLoading(false);
    };
    fetchTalent();
  }, []);
  */

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white flex flex-col">
      
      {/* --- 1. HERO SECTION --- */}
      <div className="relative overflow-hidden">
        
        {/* Navbar */}
        <div className="relative z-50">
           <Navbar />
        </div>

        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 lg:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT: Copy & CTAs */}
            <div className="space-y-8">
               
               {/* Vetted Badge */}
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md"
               >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Vetted & Verified Network</span>
               </motion.div>

               <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                  The Top 1% of <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Live Talent.
                  </span>
               </h1>
               
               <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                  We are not an open marketplace. We are a curated network of professional hosts, vetted for technical excellence and sales performance.
               </p>
               
               {/* --- FUTURE: SEARCH BAR (Uncomment when you have talent) ---
               <form onSubmit={handleSearch} className="relative max-w-md pt-4">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                     <Search className="text-gray-400" size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by niche (e.g. 'Tech', 'Fashion')..." 
                    className="w-full pl-12 pr-32 py-4 bg-white/10 border border-white/10 rounded-full backdrop-blur-md text-white placeholder-gray-500 outline-none focus:border-white/30 focus:bg-white/15 transition-all"
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 bg-white text-black px-6 rounded-full font-bold text-sm hover:scale-105 transition duration-200">
                     Search
                  </button>
               </form>
               */}

               {/* CURRENT: ACTION BUTTONS */}
               <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/onboarding?role=brand">
                    <button className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                      Hire Talent
                    </button>
                  </Link>
                  <Link href="/onboarding?role=creator">
                    <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm border border-white/20 hover:bg-white/10 transition">
                      Apply to Join
                    </button>
                  </Link>
               </div>

            </div>

            {/* RIGHT: Visual Card Effect */}
            <div className="relative hidden lg:block h-[600px] pointer-events-none">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2, duration: 0.8 }}
                 className="absolute top-10 right-10 w-80 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 transform rotate-3 shadow-2xl z-20"
               >
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-4 bg-gray-800">
                     <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop" className="object-cover w-full h-full opacity-80" />
                     <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/> LIVE
                     </div>
                     <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="text-white text-xs font-bold">Sarah Jenkins</div>
                              <CheckCircle size={12} className="text-blue-400 fill-blue-400"/>
                           </div>
                           <div className="flex items-center justify-between text-[10px] text-gray-300">
                              <span className="flex items-center gap-1"><Wifi size={10} className="text-green-400"/> 1Gbps Fiber</span>
                              <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400"/> 5.0</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
               {/* Decorative card behind */}
               <div className="absolute top-20 right-40 w-80 bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-4 transform -rotate-6 z-10 opacity-60 h-[400px]"></div>
            </div>
        </div>

      </div>

      {/* --- 2. MISSION / QUALITY SECTION --- */}
      <div className="bg-zinc-950 border-t border-white/10 relative z-20">
         <div className="max-w-7xl mx-auto px-6 py-24">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-6">More than a marketplace.<br/>A production partner.</h2>
               <p className="text-gray-400 leading-relaxed">
                  We bridge the gap between amateur influencers and professional broadcast teams. 
                  Every stream is technically verified, supervised, and optimized for sales.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Card 1 */}
               <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                     <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Rigorous Vetting</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     We don't accept everyone. Talent must pass a technical audit (lighting, audio, internet speed) and demonstrate proven retention capabilities before joining our roster.
                  </p>
               </div>
               {/* Card 2 */}
               <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300">
                  <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                     <Sliders size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Broadcast Assurance</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     We work directly with creators to optimize their setup. No pixelated streams or bad audio. We ensure the technical quality matches your brand's reputation.
                  </p>
               </div>
               {/* Card 3 */}
               <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300">
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mb-6">
                     <MonitorPlay size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Live Brand Console</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                     Brands aren't left in the dark. Join our virtual "Control Room" to watch the stream live, send real-time prompts to the host, and monitor safety protocols.
                  </p>
               </div>
            </div>

         </div>
      </div>

      {/* --- 3. INTEGRATION ECOSYSTEM --- */}
      <div className="border-t border-white/5 bg-black/50 backdrop-blur-sm relative z-30">
         <div className="max-w-7xl mx-auto px-6 py-16 text-center">
             <p className="text-xs font-bold tracking-[0.2em] text-gray-600 uppercase mb-10">
                 Native Platform Compatibility
             </p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-24 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                 <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default text-white">
                    TikTok <span className="font-light text-gray-500">Live</span>
                 </span>
                 <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default text-white">
                    Instagram <span className="font-light text-gray-500">Live</span>
                 </span>
                 <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default text-white">
                    Twitch
                 </span>
                 <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-default text-white">
                    YouTube <span className="font-light text-gray-500">Live</span>
                 </span>
             </div>
         </div>
      </div>

      {/* --- FUTURE: FEATURED GRID (Uncomment when you have talent) ---
      <div className="bg-white text-black py-20 rounded-t-[3rem] relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto px-4">
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
                {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse"/>)}
            </div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                No featured talent found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {influencers.map((inf) => (
                <Link href={`/marketplace/${inf.handle || inf.id}`} key={inf.id} className="group block h-full">
                  <motion.div 
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 flex flex-col"
                  >
                    <div className="relative h-80 bg-gray-200 overflow-hidden">
                      {inf.avatar_url || inf.cover_photos?.[0] ? (
                          <img src={inf.avatar_url || inf.cover_photos?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={inf.name}/>
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><User size={64} /></div>
                      )}
                      {inf.niches && inf.niches.length > 0 && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                             <Zap size={10} className="text-yellow-500 fill-yellow-500" /> {inf.niches[0]}
                          </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{inf.name}</h3>
                        {inf.price_rate && <span className="text-sm font-mono font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">${inf.price_rate}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-6 truncate">@{inf.handle} • {inf.location || "Global"}</p>
                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Avg Retention</div>
                          <div className="font-mono font-bold text-indigo-600 text-sm">{inf.retention_rate || "N/A"}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
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
      */
      }

    </div>
  );
}