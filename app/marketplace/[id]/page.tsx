"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient"; 
import { useBooking } from "../../context/BookingContext"; 
// 1. IMPORT CLERK HOOK
import { useUser } from "@clerk/nextjs";
import { 
  MapPin, CheckCircle, Clock, Instagram, Youtube, Twitch, Twitter, 
  ChevronRight, Share2, Heart, ShieldCheck, X, Play, Camera, Mic, Wifi, Users, Smartphone, Globe, Star
} from "lucide-react";
import { getUserTimeZone } from "../../lib/dateUtils"; 

// --- TYPE DEFINITION ---
type Profile = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatar_url: string;
  cover_photos: string[];
  portfolio_urls: string[];
  niches: string[];
  follower_count_total: number;
  socials: Record<string, { handle: string, followers: string }>; 
  pricing_packages: { 
    packages: string[]; 
    rates: Record<string, number>; 
  }; 
  price_rate: string;
  verified?: boolean;
  job_title?: string;
};

// --- Helpers ---
const getPackageIcon = (name: string) => {
  if (name.includes('Stream')) return <Wifi size={18} />;
  if (name.includes('Shoutout')) return <Mic size={18} />;
  return <Camera size={18} />;
};

const getSocialUrl = (platform: string, handle: string) => {
  if (!handle) return '#';
  const cleanHandle = handle.replace('@', '');
  switch(platform) {
    case 'instagram': return `https://instagram.com/${cleanHandle}`;
    case 'tiktok': return `https://www.tiktok.com/@${cleanHandle}`;
    case 'youtube': return `https://youtube.com/${cleanHandle}`;
    case 'twitch': return `https://twitch.tv/${cleanHandle}`;
    case 'twitter': return `https://twitter.com/${cleanHandle}`;
    default: return '#';
  }
};

const getSocialIcon = (id: string) => {
  switch(id) {
    case 'instagram': return <Instagram size={14} />;
    case 'youtube': return <Youtube size={14} />;
    case 'twitter': return <Twitter size={14} />;
    case 'twitch': return <Twitch size={14} />;
    case 'tiktok': return <Smartphone size={14} />;
    default: return <Globe size={14} />;
  }
};

const formatFollowers = (num: number) => {
  if (!num) return "0";
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

// --- Main Component ---
export default function CreatorProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  // 2. USE CLERK DIRECTLY FOR AUTH
  const { user, isLoaded } = useUser(); 
  
  // Only use Context for the action, not the user state
  const { addBooking } = useBooking(); 
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  
  // UI State
  const [mediaModal, setMediaModal] = useState<{ url: string, type: 'video' | 'image' } | null>(null);

useEffect(() => {
    async function fetchData() {
      if (!id) return;

      // --- A. Fetch the Profile being Viewed (Your existing logic) ---
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', id)
        .maybeSingle();

      if (!data) {
         const { data: idData } = await supabase
           .from('profiles')
           .select('*')
           .eq('id', id)
           .maybeSingle();
         data = idData;
      }

      if (data) {
        setProfile(data);
        
        // Default Package
        if (data.pricing_packages?.packages?.length > 0) {
           setSelectedPackage(data.pricing_packages.packages[0]);
        }
        // Default Platform
        if (data.socials) {
           const activeSocials = Object.entries(data.socials).filter(([_, val]: any) => val?.handle);
           if (activeSocials.length > 0) setSelectedPlatform(activeSocials[0][0]);
        }
      }

      // --- B. Fetch the Current User's Role (NEW) ---
      // We check: "Who is the person currently logged in?"
      if (user) {
         const { data: myData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
         if (myData) {
             setCurrentUserRole(myData.role);
         }
      }

      setLoading(false);
    }

    fetchData();
  }, [id, user]);

  // --- Dynamic Price Calculation ---
  const getCurrentPrice = () => {
     if (selectedPackage && profile?.pricing_packages?.rates) {
        return profile.pricing_packages.rates[selectedPackage] || 0;
     }
     return Number(profile?.price_rate) || 0;
  };

  const handleBook = () => {
    // 3. WAIT FOR CLERK TO LOAD BEFORE REDIRECTING
    if (!isLoaded) return; 

    // Redirect to Sign In if not logged in
    if (!user) {
        // Optional: Save the current URL to return after login
        // localStorage.setItem('redirect_after_login', window.location.pathname);
        return router.push("/sign-in"); 
    }
    
    if (!profile) return;
    if (!selectedDate) return alert("Please select a date and time for the booking.");
    if (!selectedPlatform) return alert("Please select which platform you want to book.");

    const finalPrice = getCurrentPrice();

    addBooking(
    profile.id,                         // creatorId
    finalPrice.toString(),              // price (Context expects a string)
    profile.name || profile.handle,      // name
    selectedDate                        // date (The raw string from your input)
    );
        
    router.push("/checkout");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Profile not found</div>;

  const currentPrice = getCurrentPrice();

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* 1. Cover Image Header */}
      <div className="relative h-[300px] md:h-[400px] bg-gray-100 group">
         {profile.cover_photos?.[0] ? (
            <img src={profile.cover_photos[0]} className="w-full h-full object-cover" alt="Cover" />
         ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
         )}
         <button 
            className="absolute top-6 left-6 bg-white/90 p-3 rounded-full hover:scale-105 transition shadow-lg z-20" 
            onClick={() => router.back()}
         >
            <ChevronRight className="rotate-180 text-black" size={20}/>
         </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-24 relative z-10">
         <div className="flex flex-col lg:flex-row gap-12">
            
            {/* --- LEFT COLUMN: Profile Info --- */}
            <div className="flex-1">
               <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 mb-8">
                  
                  {/* Avatar & Name */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6">
                     <div className="flex gap-6">
                        <div className="w-28 h-28 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100 relative">
                           {profile.avatar_url ? (
                              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                           ) : (
                              // Placeholder if no avatar
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              </div>
                           )}
                        </div>
                        <div className="pt-4">
                           <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 text-gray-900">
                              {profile.name || profile.handle} 
                              {profile.verified && <CheckCircle size={22} className="text-blue-500 fill-blue-500 text-white" />}
                           </h1>
                           
                           <div className="flex flex-wrap items-center gap-4 mt-2">
                               <p className="text-gray-500 font-bold">@{profile.handle}</p>
                               {/* Total Follower Count */}
                               {profile.follower_count_total > 0 && (
                                   <span className="flex items-center gap-1.5 text-xs font-bold bg-black text-white px-3 py-1 rounded-full">
                                       <Users size={12} /> {formatFollowers(profile.follower_count_total)} Fans
                                   </span>
                               )}
                           </div>
                           
                           {/* Clickable Social Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.socials && Object.entries(profile.socials).map(([key, data]: any) => {
                            if (!data.handle) return null;
                            return (
                            <a 
                                key={key}
                                href={getSocialUrl(key, data.handle)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-xs font-medium transition-colors border border-gray-200 group"
                            >
                                <span className="group-hover:scale-110 transition-transform">
                                {getSocialIcon(key)}
                                </span>
                                <span className="flex items-baseline gap-1">
                                <span className="font-bold">{formatFollowers(data.followers)}</span>
                                <span className="text-[10px] opacity-70 font-normal">followers</span>
                                </span>
                            </a>
                            );
                        })}
                        </div>
                        </div>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex gap-2 self-start md:self-auto pt-4">
                        <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition"><Share2 size={20}/></button>
                        <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition"><Heart size={20}/></button>
                     </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full my-6"></div>

                  {/* Location & Rating */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-8 font-medium">
                     {profile.location && <div className="flex items-center gap-2"><MapPin size={16}/> {profile.location}</div>}
                     <div className="flex items-center gap-2 text-black font-bold"><Star size={16} className="text-yellow-400 fill-yellow-400"/> 5.0 <span className="text-gray-400 font-normal">(New Creator)</span></div>
                  </div>

                  {/* Bio */}
                  <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
                     {profile.bio || "No bio available."}
                  </div>

                  {/* Niches */}
                  <div className="flex flex-wrap gap-2 mb-8">
                     {profile.niches?.map(n => (
                        <span key={n} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-wide">{n}</span>
                     ))}
                  </div>

                  {/* Portfolio Grid (Images & Video) */}
                  {profile.portfolio_urls?.length > 0 && (
                     <div className="space-y-4">
                        <h3 className="font-bold text-xl text-gray-900">Portfolio</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {profile.portfolio_urls.map((url, idx) => {
                              const isVideo = url.toLowerCase().match(/\.(mp4|mov|webm)$/);
                              return (
                                 <div 
                                    key={idx} 
                                    className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative cursor-pointer hover:shadow-lg transition-all group border border-gray-200"
                                    onClick={() => setMediaModal({ url, type: isVideo ? 'video' : 'image' })}
                                 >
                                    {isVideo ? (
                                       <>
                                         <video 
                                            src={url} 
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                                            muted 
                                            loop 
                                            playsInline
                                            onMouseOver={e => e.currentTarget.play()}
                                            onMouseOut={e => e.currentTarget.pause()}
                                         />
                                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/40">
                                               <Play size={20} className="ml-1 text-white fill-white" />
                                            </div>
                                         </div>
                                       </>
                                    ) : (
                                       <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Portfolio" />
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* --- RIGHT COLUMN: Booking & Pricing (Sticky) --- */}
            <div className="lg:w-[420px]">
               <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 sticky top-8">
                  
                  {/* Dynamic Price Header */}
                  <div className="flex justify-between items-end mb-8">
                     <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Price</p>
                        <div className="text-5xl font-black text-gray-900 tracking-tight">
                            ${currentPrice}
                        </div>
                     </div>
                     <div className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <Clock size={12}/> Available Now
                     </div>
                  </div>

                  {/* 1. Package Selector */}
                  <div className="space-y-4 mb-8">
                     <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Select Package</label>
                     <div className="grid gap-3">
                        {profile.pricing_packages?.packages?.map((pkgName: string) => {
                            const isSelected = selectedPackage === pkgName;
                            return (
                               <div 
                                  key={pkgName}
                                  onClick={() => setSelectedPackage(pkgName)}
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                               >
                                  <div className="flex items-center gap-3">
                                     <div className={`p-2.5 rounded-full transition-colors ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 group-hover:text-black'}`}>
                                        {getPackageIcon(pkgName)}
                                     </div>
                                     <span className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-gray-600'}`}>{pkgName}</span>
                                  </div>
                               </div>
                            );
                        })}
                     </div>
                  </div>

                  {/* 2. Platform Selector */}
                  <div className="space-y-4 mb-8">
                      <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Select Platform</label>
                      <div className="flex flex-wrap gap-2">
                          {profile.socials && Object.entries(profile.socials).filter(([_, val]: any) => val?.handle).length > 0 ? (
                              Object.entries(profile.socials).map(([key, data]: any) => {
                                  if (!data.handle) return null;
                                  const isSelected = selectedPlatform === key;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => setSelectedPlatform(key)}
                                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold capitalize border-2 transition-all ${isSelected ? 'border-black bg-black text-white shadow-lg' : 'border-gray-100 text-gray-600 hover:border-gray-300 bg-white'}`}
                                    >
                                        {getSocialIcon(key)}
                                        {key}
                                    </button>
                                  );
                              })
                          ) : (
                              <div className="text-sm text-gray-400 italic">No platforms available</div>
                          )}
                      </div>
                  </div>

                  {/* 3. Date & Time Picker */}
                  <div className="space-y-4 mb-8">
                     <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Date & Time</label>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-100">
                           {getUserTimeZone()}
                        </span>
                     </div>
                     <input 
                        type="datetime-local" 
                        className="w-full p-4 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                        onChange={(e) => setSelectedDate(e.target.value)}
                     />
                  </div>

                  {/* 4. Action Button */}
                    {currentUserRole === 'creator' ? (
                      <button 
                         disabled
                         className="w-full bg-gray-100 text-gray-400 py-5 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                         Creators cannot book creators
                      </button>
                  ) : (
                      <button 
                         onClick={handleBook}
                         className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group"
                      >
                         Send Request 
                         <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                      </button>
                  )}
                  
                  <div className="mt-6 text-center">
                     <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5 font-medium">
                        <ShieldCheck size={14} className="text-green-600"/> 
                        Secure Payment via Stripe
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </div>

      {/* --- Lightbox Modal (Full Screen Media) --- */}
      {mediaModal && (
         <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <button 
               onClick={() => setMediaModal(null)}
               className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
               <X size={28} />
            </button>
            
            <div className="max-w-6xl max-h-[90vh] w-full rounded-3xl overflow-hidden shadow-2xl relative bg-black border border-white/10">
               {mediaModal.type === 'video' ? (
                  <video 
                     src={mediaModal.url} 
                     controls 
                     autoPlay 
                     className="w-full h-full max-h-[85vh] object-contain"
                  />
               ) : (
                  <img 
                     src={mediaModal.url} 
                     className="w-full h-full max-h-[85vh] object-contain" 
                     alt="Full view" 
                  />
               )}
            </div>
         </div>
      )}

    </div>
  );
}