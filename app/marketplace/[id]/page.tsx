"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, MapPin, Wifi, Zap, Video, ArrowLeft, Star, Clock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Navbar";
import { useBooking } from "../../context/BookingContext";
import { useUser, useClerk } from "@clerk/nextjs";
import { getUserTimeZone } from "../../lib/dateUtils";

export default function CreatorProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const { addBooking } = useBooking();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(data);
    };
    if (id) fetchProfile();
  }, [id]);

const handleBook = () => {
    if (!user) {
      openSignIn();
      return;
    }
    if (!scheduleDate) {
      alert("Please select a date and time for the stream.");
      return;
    }
    
    // CLEANER: Just pass the raw value. 
    // The updated BookingContext will automatically convert this to UTC.
    addBooking(String(id), profile.price_rate, profile.name, scheduleDate);
    
    alert("Request Sent!");
    router.push('/agency');
  };


  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="text-gray-400 text-sm tracking-widest uppercase">Loading Profile...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <Navbar />
      
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        
        {/* Breadcrumb */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-8 hover:text-black uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* --- LEFT COLUMN: CONTENT --- */}
          <div className="flex-1">
            
            {/* Header Info */}
            <div className="flex items-center gap-6 mb-8">
              <img 
                src={profile.avatar_url || "https://via.placeholder.com/150"} 
                className="w-24 h-24 rounded-full object-cover border border-gray-100 shadow-sm"
              />
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">{profile.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                   <span className="flex items-center gap-1"><MapPin size={14}/> {profile.location || "Global"}</span>
                   <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                   <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500"/> 5.0 (12 Reviews)</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 w-full mb-8"></div>

            {/* Bio */}
            <div className="mb-10">
              <h3 className="font-bold text-lg mb-4">About</h3>
              <p className="text-gray-600 leading-relaxed text-lg font-light">
                {profile.bio || "Professional live stream host specializing in high-conversion product demonstrations. I bring energy, clarity, and deep technical knowledge to every broadcast."}
              </p>
            </div>

            {/* Tech Specs (Styled as Features) */}
            <div className="mb-10">
               <h3 className="font-bold text-lg mb-6">Studio Setup</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Wifi size={18}/></div>
                    <div>
                      <div className="font-bold text-sm">Gigabit Fiber</div>
                      <div className="text-xs text-gray-500">940 Mbps Upload Verified</div>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Video size={18}/></div>
                    <div>
                      <div className="font-bold text-sm">Sony A7S III</div>
                      <div className="text-xs text-gray-500">4K 60fps Capable</div>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Zap size={18}/></div>
                    <div>
                      <div className="font-bold text-sm">Professional Audio</div>
                      <div className="text-xs text-gray-500">Shure SM7B + Cloudlifter</div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Past Work */}
            <div>
              <h3 className="font-bold text-lg mb-6">Recent Streams</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center relative group overflow-hidden cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1598550881338-960301ac65ad?w=500&q=80" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"/>
                    <div className="relative z-10 bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                       <Video size={24} fill="currentColor" />
                    </div>
                 </div>
                 <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center relative group overflow-hidden cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"/>
                    <div className="relative z-10 bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                       <Video size={24} fill="currentColor" />
                    </div>
                 </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: STICKY BOOKING CARD --- */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-28 p-8 border border-gray-200 rounded-3xl shadow-xl bg-white">
              
              <div className="flex justify-between items-end mb-6">
                <div>
                   <span className="text-3xl font-serif font-bold">{profile.price_rate}</span>
                   <span className="text-gray-500 ml-1">/ stream</span>
                </div>
                <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                  Available Now
                </div>
              </div>

            <div className="space-y-4 mb-8">
             {/* DATE PICKER */}
             <div className="p-4 border border-gray-200 rounded-xl hover:border-black transition bg-gray-50">
                <div className="flex justify-between mb-2">
                   <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stream Time</div>
                   {/* SHOW USER THEIR TIMEZONE */}
                   <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      My Time: {getUserTimeZone()}
                   </div>
                </div>
                <input 
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
             </div>

                 {/* 2. DURATION (Static for now) */}
                 <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center cursor-not-allowed opacity-60">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Duration</div>
                    <div className="text-sm font-bold">1 Hour</div>
                 </div>
              </div>

              <button 
                onClick={handleBook}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg mb-4"
              >
                Book {profile.name}
              </button>

              <div className="text-center">
                 <p className="text-xs text-gray-400 mb-2">You won't be charged yet</p>
                 <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    <span>Secure Payment</span>
                    <span>•</span>
                    <span>Money Back Guarantee</span>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}