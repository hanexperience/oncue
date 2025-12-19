"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { Search, MapPin, Star, Users } from "lucide-react";
import Navbar from "../components/Navbar"; // Assuming you have this

export default function MarketplacePage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCreators = async () => {
      // Fetch all profiles that are creators
      const { data } = await supabase
        .from('profiles')
        .select('*') // This includes 'handle'
        .eq('role', 'creator');
        
      if (data) setCreators(data);
      setLoading(false);
    };
    fetchCreators();
  }, []);

  // Simple Search Filter
  const filteredCreators = creators.filter(c => 
     c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.niches?.some((n: string) => n.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div>
              <h1 className="text-4xl font-serif font-bold mb-2">Find Talent</h1>
              <p className="text-gray-500">Book professional live stream hosts instantly.</p>
           </div>
           
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="text" 
                placeholder="Search by name, handle, or niche..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 focus:border-black outline-none shadow-sm"
              />
           </div>
        </div>

        {/* Creator Grid */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-96 bg-gray-200 rounded-3xl animate-pulse"/>)}
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                // --- THE KEY FIX IS HERE ---
                // We use creator.handle if it exists, otherwise fallback to ID
                <Link 
                   href={`/marketplace/${creator.handle || creator.id}`} 
                   key={creator.id}
                   className="group block"
                >
                   <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative group-hover:-translate-y-1">
                      
                      {/* Image */}
                      <div className="aspect-[4/5] bg-gray-100 relative">
                         <img 
                           src={creator.avatar_url} 
                           className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                           alt={creator.name}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition"/>
                         
                         {/* Price Tag */}
                         <div className="absolute bottom-4 left-4 text-white">
                            <div className="font-bold text-lg">{creator.name}</div>
                            <div className="text-xs font-medium opacity-90 flex items-center gap-1">
                               <MapPin size={12}/> {creator.location || "Remote"}
                            </div>
                         </div>
                         
                         <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                            ${creator.price_rate || "100"}/hr
                         </div>
                      </div>
                      
                      {/* Details */}
                      <div className="p-4">
                         <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                               <Users size={12}/> {(creator.follower_count_total / 1000).toFixed(1)}k
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                               <Star size={12} fill="currentColor"/> 5.0
                            </div>
                         </div>
                         
                         {/* Niches */}
                         <div className="flex flex-wrap gap-1">
                            {creator.niches?.slice(0, 2).map((niche: string) => (
                               <span key={niche} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-100 px-2 py-1 rounded-full">
                                  {niche}
                               </span>
                            ))}
                         </div>
                      </div>

                   </div>
                </Link>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}