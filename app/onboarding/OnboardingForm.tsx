// app/onboarding/OnboardingForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Still needed here
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import { Building2, User, ArrowRight, Loader2, Check } from "lucide-react";

export default function OnboardingForm() {
  const { user } = useUser();
  const router = useRouter();
  // VVV THIS IS THE HOOK CAUSING THE ISSUE VVV
  const searchParams = useSearchParams(); 
  const roleParam = searchParams.get('role'); 
  // ... rest of your component logic ...
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // States
  const [companyName, setCompanyName] = useState("");
  const [creatorData, setCreatorData] = useState({ handle: "", rate: "", bio: "", location: "" });

  useEffect(() => {
    if (roleParam === 'brand') setRole('brand');
    if (roleParam === 'creator') setRole('creator');
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;
    setLoading(true);

    const updateData: any = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      avatar_url: user.imageUrl,
      role: role,
      onboarding_status: 'complete'
    };

    if (role === 'brand') {
      updateData.name = companyName;
      updateData.handle = "@" + companyName.toLowerCase().replace(/\s/g, '');
    } else {
      updateData.name = user.fullName;
      updateData.handle = creatorData.handle;
      updateData.price_rate = creatorData.rate;
      updateData.bio = creatorData.bio;
      updateData.location = creatorData.location;
    }

    const { error } = await supabase.from('profiles').upsert(updateData);

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
    } else {
      if (role === 'brand') router.push('/marketplace');
      else router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
           <div className="font-serif font-black text-2xl tracking-tighter mb-2">ON CUE</div>
           <div className="text-sm text-gray-500 uppercase tracking-widest">Live Commerce OS</div>
        </div>

        <div className="relative z-10 max-w-md">
           <h2 className="text-4xl font-serif font-medium mb-6 leading-tight">
             {role === 'creator' 
               ? "Turn your studio into a scalable business." 
               : "Direct professional live streams remotely."}
           </h2>
           <div className="space-y-4 text-gray-400 text-sm">
             <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center"><Check size={14}/></div> Instant Payments</div>
             <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center"><Check size={14}/></div> Verified Analytics</div>
           </div>
        </div>

        {/* Abstract Background Blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* STEP 1: SELECT ROLE */}
          {!role && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-serif font-bold mb-2">Join On Cue</h1>
              <p className="text-gray-500 mb-8">Choose your account type to get started.</p>
              
              <div className="space-y-4">
                 <button onClick={() => setRole('brand')} className="w-full p-6 border border-gray-200 rounded-2xl flex items-center gap-4 hover:border-black hover:shadow-lg transition-all group text-left">
                    <div className="bg-gray-50 p-4 rounded-full group-hover:bg-black group-hover:text-white transition"><Building2 size={24}/></div>
                    <div>
                       <div className="font-bold text-lg">Hire Talent</div>
                       <div className="text-sm text-gray-500">I am a Brand or Agency</div>
                    </div>
                 </button>
                 <button onClick={() => setRole('creator')} className="w-full p-6 border border-gray-200 rounded-2xl flex items-center gap-4 hover:border-black hover:shadow-lg transition-all group text-left">
                    <div className="bg-gray-50 p-4 rounded-full group-hover:bg-black group-hover:text-white transition"><User size={24}/></div>
                    <div>
                       <div className="font-bold text-lg">Work as Talent</div>
                       <div className="text-sm text-gray-500">I am a Creator or Host</div>
                    </div>
                 </button>
              </div>
            </div>
          )}

          {/* STEP 2: BRAND FORM */}
          {role === 'brand' && (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-500">
               <button type="button" onClick={() => setRole(null)} className="text-xs font-bold text-gray-400 mb-6 hover:text-black uppercase tracking-wider">← Back</button>
               
               <h1 className="text-3xl font-serif font-bold mb-2">Agency Setup</h1>
               <p className="text-gray-500 mb-8">What is your organization called?</p>

               <div className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Company Name</label>
                   <input 
                      autoFocus 
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full text-xl font-medium border-b-2 border-gray-200 py-3 focus:border-black outline-none bg-transparent placeholder:text-gray-300 transition-colors"
                      placeholder="e.g. Acme Corp" 
                   />
                 </div>
                 <button disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition shadow-xl hover:shadow-2xl">
                   {loading ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                 </button>
               </div>
            </form>
          )}

          {/* STEP 3: CREATOR FORM */}
          {role === 'creator' && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
               <button type="button" onClick={() => setRole(null)} className="text-xs font-bold text-gray-400 mb-6 hover:text-black uppercase tracking-wider">← Back</button>
               
               <h1 className="text-3xl font-serif font-bold mb-2">Creator Profile</h1>
               <p className="text-gray-500 mb-6">Build your live resume.</p>

               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Handle</label>
                  <input required value={creatorData.handle} onChange={e => setCreatorData({...creatorData, handle: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="@username" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Rate (1hr)</label>
                    <input required value={creatorData.rate} onChange={e => setCreatorData({...creatorData, rate: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="$500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Location</label>
                    <input required value={creatorData.location} onChange={e => setCreatorData({...creatorData, location: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="City" />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Bio</label>
                  <textarea required value={creatorData.bio} onChange={e => setCreatorData({...creatorData, bio: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 h-24 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none" placeholder="I specialize in..." />
               </div>
               <button disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition shadow-xl hover:shadow-2xl">
                 {loading ? <Loader2 className="animate-spin" /> : "Finish Profile"}
               </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}