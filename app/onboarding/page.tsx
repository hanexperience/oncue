"use client";
import React, { useState, useEffect, Suspense } from "react"; // Added Suspense import
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";
import { 
  ArrowRight, Check, Camera, Wifi, 
  Mic, Smartphone, Globe, DollarSign, User, Building2, Loader2, HelpCircle 
} from "lucide-react";
import { useBooking } from "../context/BookingContext";

// 1. Rename your main component to 'OnboardingContent'
function OnboardingContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams(); // This was the cause of the error
  const roleParam = searchParams.get('role');
  const { setUserRole } = useBooking();
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [creatorData, setCreatorData] = useState({
    handle: "", instagram: "", tiktok: "", location: "", bio: "",
    rate: "", category: "Fashion", internet_speed: "", experience: "1-3 Years",
    gear: [] as string[]
  });

  useEffect(() => {
    if (roleParam === 'brand') setRole('brand');
    if (roleParam === 'creator') setRole('creator');
  }, [roleParam]);

  const toggleGear = (item: string) => {
    setCreatorData(prev => {
      const exists = prev.gear.includes(item);
      if (exists) return { ...prev, gear: prev.gear.filter(g => g !== item) };
      return { ...prev, gear: [...prev.gear, item] };
    });
  };

  const handleFinalSubmit = async () => {
    if (!user || !role) return;
    setLoading(true);

    const commonData = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      avatar_url: user.imageUrl,
      role: role,
      onboarding_status: 'complete'
    };

    let specificData = {};
    if (role === 'brand') {
      specificData = {
        name: companyName,
        handle: "@" + companyName.toLowerCase().replace(/\s/g, ''),
      };
    } else {
      specificData = {
        name: user.fullName,
        handle: creatorData.handle,
        instagram_handle: creatorData.instagram,
        tiktok_handle: creatorData.tiktok,
        location: creatorData.location,
        bio: creatorData.bio,
        price_rate: creatorData.rate,
        category: creatorData.category,
        internet_speed: creatorData.internet_speed,
        years_experience: creatorData.experience,
        tech_setup: creatorData.gear
      };
    }

    const { error } = await supabase.from('profiles').upsert({ ...commonData, ...specificData });
    if (error) {
        alert("Error: " + error.message);
        setLoading(false);
        } else {
        setUserRole(role); 
        if (role === 'brand') router.push('/marketplace');
        else router.push('/dashboard');
        }
    };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // --- ROLE SELECTION (High Contrast) ---
  if (!role) {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">
             {/* Left Panel: Branding */}
             <div className="w-full lg:w-1/2 bg-black text-white p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10"><div className="font-serif font-black text-3xl tracking-tighter mb-2">ON CUE</div></div>
                <div className="relative z-10 max-w-lg mt-10 lg:mt-0">
                    <h2 className="text-5xl font-serif font-medium mb-6 leading-tight">Welcome to the <br/>Live Economy.</h2>
                    <p className="text-gray-400 text-lg">The operating system for professional live commerce.</p>
                </div>
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[100px]"></div>
             </div>

             {/* Right Panel: Selection */}
             <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-gray-50">
                <div className="w-full max-w-md space-y-6">
                    <h1 className="text-3xl font-serif font-bold text-black mb-8">How will you use On Cue?</h1>
                    
                    <button onClick={() => setRole('brand')} className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl flex items-center gap-6 hover:border-black hover:shadow-xl transition-all group text-left">
                        <div className="bg-gray-100 p-4 rounded-full group-hover:bg-black group-hover:text-white transition-colors"><Building2 size={28}/></div>
                        <div><div className="font-bold text-xl text-black">Hire Talent</div><div className="text-sm text-gray-600 font-medium">I represent a Brand</div></div>
                    </button>
                    
                    <button onClick={() => setRole('creator')} className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl flex items-center gap-6 hover:border-black hover:shadow-xl transition-all group text-left">
                        <div className="bg-gray-100 p-4 rounded-full group-hover:bg-black group-hover:text-white transition-colors"><User size={28}/></div>
                        <div><div className="font-bold text-xl text-black">Work as Talent</div><div className="text-sm text-gray-600 font-medium">I am a Host / Creator</div></div>
                    </button>
                </div>
             </div>
        </div>
    );
  }

  // --- CREATOR ONBOARDING (Split Screen) ---
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-black">
      
      {/* LEFT SIDE: BLACK CONTEXT PANEL (High Contrast) */}
      <div className="hidden lg:flex w-1/3 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
           <div className="font-serif font-black text-2xl tracking-tighter mb-12">ON CUE</div>
           
           {/* Steps */}
           <div className="space-y-6">
             {role === 'brand' ? (
               <div className="flex gap-4 items-center opacity-100 translate-x-2">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white bg-white text-black">
                   1
                 </div>
                 <div>
                   <div className="font-bold text-lg">Organization</div>
                   <div className="text-xs text-gray-400 font-medium">Agency details</div>
                 </div>
               </div>
             ) : (
               [
                 { n: 1, label: "Identity", desc: "Social presence verification." },
                 { n: 2, label: "Tech Check", desc: "Studio & speed audit." },
                 { n: 3, label: "Profile", desc: "Rate & categorization." }
               ].map((s) => (
                 <div key={s.n} className={`flex gap-4 items-center transition-all duration-300 ${step === s.n ? "opacity-100 translate-x-2" : "opacity-40"}`}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step === s.n ? "border-white bg-white text-black" : "border-gray-600 text-gray-400"}`}>
                     {step > s.n ? <Check size={16}/> : s.n}
                   </div>
                   <div>
                     <div className="font-bold text-lg">{s.label}</div>
                     <div className="text-xs text-gray-400 font-medium">{s.desc}</div>
                   </div>
                 </div>
               ))
             )}
           </div>
           </div>

        {/* Dynamic Tip Box */}
        <div className="relative z-10 bg-gray-900 border border-gray-800 p-6 rounded-xl">
           <div className="font-bold mb-2 flex items-center gap-2 text-yellow-500 text-sm uppercase tracking-wider">
             <HelpCircle size={16} /> Why we ask
           </div>
           <p className="text-sm text-gray-300 leading-relaxed">
             {step === 1 && "Brands require linked social accounts to verify your audience engagement and content style."}
             {step === 2 && "Our 'Verified Tech' badge requires proof of internet speed. This increases your booking rate by 3x."}
             {step === 3 && "Set a rate that reflects your hosting experience, not just your follower count."}
           </p>
        </div>
      </div>

      {/* RIGHT SIDE: THE FORM (Darker Text) */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-8 lg:p-20 bg-white">
        <div className="w-full max-w-lg">
            
            {/* --- BRAND ONBOARDING FORM --- */}
          {role === 'brand' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h1 className="text-4xl font-serif font-bold mb-3 text-black">Agency Setup</h1>
              <p className="text-gray-600 font-medium mb-10 text-lg">What is your organization called?</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Company Name</label>
                  <input 
                    autoFocus 
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black focus:ring-0 outline-none transition-colors text-black placeholder:text-gray-300"
                    placeholder="e.g. Acme Corp" 
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleFinalSubmit} 
                    disabled={loading} 
                    className="w-full bg-black text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-900 shadow-xl transition-transform hover:scale-[1.02]"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-4xl font-serif font-bold mb-3 text-black">Who are you?</h1>
                    <p className="text-gray-600 font-medium mb-10 text-lg">Let's verify your digital presence.</p>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Primary Handle</label>
                            <input autoFocus value={creatorData.handle} onChange={e => setCreatorData({...creatorData, handle: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black focus:ring-0 outline-none transition-colors text-black placeholder:text-gray-300" placeholder="@username" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Instagram</label>
                                <input value={creatorData.instagram} onChange={e => setCreatorData({...creatorData, instagram: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl bg-white focus:border-black outline-none transition-colors text-black" placeholder="@insta" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">TikTok</label>
                                <input value={creatorData.tiktok} onChange={e => setCreatorData({...creatorData, tiktok: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl bg-white focus:border-black outline-none transition-colors text-black" placeholder="@tiktok" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">City & Country</label>
                            <input value={creatorData.location} onChange={e => setCreatorData({...creatorData, location: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none transition-colors text-black" placeholder="e.g. Melbourne, Australia" />
                        </div>
                        
                        <div className="pt-8 flex justify-end">
                            <button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-gray-800 shadow-xl transition-transform hover:scale-[1.02]">Next <ArrowRight size={20}/></button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: TECH SPECS */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-4xl font-serif font-bold mb-3 text-black">Technical Audit</h1>
                    <p className="text-gray-600 font-medium mb-10 text-lg">Select the equipment you own.</p>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-700 mb-3 tracking-wide">Upload Speed</label>
                            <div className="grid grid-cols-3 gap-4">
                                {["< 10 Mbps", "10-50 Mbps", "50+ Mbps"].map(opt => (
                                    <button 
                                        key={opt}
                                        onClick={() => setCreatorData({...creatorData, internet_speed: opt})}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${creatorData.internet_speed === opt ? "border-black bg-black text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-700 mb-3 tracking-wide">Studio Gear</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { id: "Ring Light", icon: <Wifi size={18}/> },
                                    { id: "Pro Microphone", icon: <Mic size={18}/> },
                                    { id: "DSLR Camera", icon: <Camera size={18}/> },
                                    { id: "Green Screen", icon: <Globe size={18}/> },
                                    { id: "Phone Only", icon: <Smartphone size={18}/> },
                                ].map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => toggleGear(item.id)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-bold transition-all ${creatorData.gear.includes(item.id) ? "border-green-600 bg-green-50 text-green-800" : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"}`}
                                    >
                                        <div className={creatorData.gear.includes(item.id) ? "text-green-600" : "text-gray-400"}>{item.icon}</div>
                                        {item.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 flex justify-between items-center">
                            <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
                            <button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-gray-800 shadow-xl transition-transform hover:scale-[1.02]">Next <ArrowRight size={20}/></button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: PITCH & RATE */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <h1 className="text-4xl font-serif font-bold mb-3 text-black">The Pitch</h1>
                    <p className="text-gray-600 font-medium mb-10 text-lg">Define your value.</p>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Hourly Rate</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute top-5 left-4 text-gray-400" />
                                    <input value={creatorData.rate} onChange={e => setCreatorData({...creatorData, rate: e.target.value})} className="w-full border-2 border-gray-200 p-4 pl-10 rounded-xl text-lg bg-white focus:border-black outline-none transition-colors font-bold text-black" placeholder="500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Category</label>
                                <div className="relative">
                                   <select 
                                       value={creatorData.category} 
                                       onChange={e => setCreatorData({...creatorData, category: e.target.value})}
                                       className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none appearance-none text-black font-medium"
                                   >
                                       <option>Fashion</option>
                                       <option>Tech & Gaming</option>
                                       <option>Beauty</option>
                                       <option>Home & Lifestyle</option>
                                   </select>
                                   <div className="absolute top-5 right-4 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">Bio</label>
                            <textarea value={creatorData.bio} onChange={e => setCreatorData({...creatorData, bio: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black h-32 outline-none resize-none transition-colors text-black" placeholder="I specialize in..." />
                        </div>

                        <div className="pt-8 flex justify-between items-center">
                            <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
                            <button onClick={handleFinalSubmit} disabled={loading} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-gray-900 shadow-xl transition-transform hover:scale-[1.02]">
                                {loading ? <Loader2 className="animate-spin" /> : "Finish Profile"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

// 2. Export the Wrapper with Suspense
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}