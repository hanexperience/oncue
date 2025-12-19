"use client";
import React, { useState, useEffect, Suspense, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs"; 
import { createClient } from "@supabase/supabase-js"; 
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"; // NEW IMPORTS
import { 
  Mic, Smartphone, Wifi, Camera, 
  ArrowRight, Check, CheckCircle2, DollarSign, User, Loader2, 
  Instagram, Youtube, Twitch, Twitter, Upload, X, Plus, Phone, Users, ShieldCheck, CreditCard, Lock, Mail, BellRing
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import LocationSearch from "../components/LocationSearch";
import { useDebounce } from "use-debounce";

// --- STRIPE CONFIG ---
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_STYLES = {
  style: {
    base: {
      fontSize: '16px',
      color: '#000000',
      '::placeholder': { color: '#aab7c4' },
      iconColor: '#000000',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// --- CONSTANTS ---
const NICHE_OPTIONS = ["Lifestyle", "Beauty", "Fashion", "Tech", "Crypto", "Fitness", "Food", "Travel", "Gaming", "Business", "Family", "Comedy"];
const ETHNICITY_OPTIONS = ["Prefer not to say", "Asian", "Black / African Descent", "Hispanic / Latino", "White / Caucasian", "Middle Eastern", "Mixed", "Other"];
const SOCIAL_PLATFORMS = [
  { id: "instagram", icon: Instagram, label: "Instagram" },
  { id: "tiktok", icon: Smartphone, label: "TikTok" },
  { id: "youtube", icon: Youtube, label: "YouTube" },
  { id: "twitch", icon: Twitch, label: "Twitch" },
  { id: "twitter", icon: Twitter, label: "Twitter" },
];
const PACKAGE_TEMPLATES = [
  { id: "shoutout", title: "60-Sec Shoutout", description: "A quick mention of your brand.", multiplier: 0.4, icon: Mic },
  { id: "segment", title: "15-Min Power Segment", description: "Dedicated demo or review.", multiplier: 1.0, icon: Camera },
  { id: "stream", title: "Sponsored Stream (1 Hr)", description: "Fully branded hour.", multiplier: 2.0, icon: Wifi }
];

// --- SUB-COMPONENT: CARD FORM ---
// We need this because 'useStripe' must be used inside <Elements> context
function CardVerificationForm({ onVerified }: { onVerified: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !user) return;

    setLoading(true);
    setError("");

    try {
      // 1. Get Client Secret from Supabase Edge Function
      const token = await getToken({ template: 'supabase' });
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data, error: fnError } = await supabaseAuth.functions.invoke('create-setup-intent', {
        body: { userId: user.id, email: user.primaryEmailAddress?.emailAddress }
      });

      if (fnError || !data?.clientSecret) throw new Error(fnError?.message || "Failed to init verification");

      // 2. Confirm Card Setup with Stripe
      const result = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user.fullName || "Unknown",
            email: user.primaryEmailAddress?.emailAddress
          },
        },
      });

      if (result.error) {
        setError(result.error.message || "Verification failed");
      } else {
        // Success!
        onVerified();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
       <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          <CardElement options={CARD_STYLES} />
       </div>
       {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2"><CreditCard size={16}/> {error}</div>}
       <button 
         type="submit" 
         disabled={!stripe || loading}
         className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
       >
         {loading ? <Loader2 className="animate-spin" /> : "Verify Card"}
       </button>
       <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide flex items-center justify-center gap-1">
          <Lock size={10} /> Secure Encryption via Stripe
       </p>
    </form>
  );
}

// --- MAIN COMPONENT ---
function OnboardingContent() {
  const { user } = useUser();
  const { getToken } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const { setUserRole } = useBooking();
  
  // -- STATE --
  const [role, setRole] = useState<'brand' | 'creator' | null>(null);
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Identity Status
  const [identityStatus, setIdentityStatus] = useState<'idle' | 'verified'>('idle');

  // Creator Data
  const [creatorData, setCreatorData] = useState({
    location_city: "",
    professional_title: "",
    bio: "",
    gender: "",
    dob: "",
    ethnicity: "",
    handle: "",
    socials: {} as Record<string, { handle: string, followers: string }>,
    niches: [] as string[],
    profileImage: null as File | null,
    coverPhotos: [] as File[],
    portfolio: [] as File[],
    packages: [] as string[],
    rates: {} as Record<string, string>,
    phone_number: "",
    phone_country_code: "+1"
  });

  // Derived State
  const [handleError, setHandleError] = useState("");
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [debouncedHandle] = useDebounce(creatorData.handle, 500);
  const [baseRate, setBaseRate] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);

  useEffect(() => {
    if (roleParam === 'brand') setRole('brand');
    else if (roleParam === 'creator') setRole('creator');
  }, [roleParam]);

  // --- HELPERS ---
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const toggleSelection = (list: string[], item: string) => list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  // --- HANDLE CHECKER ---
  useEffect(() => {
    const checkHandle = async () => {
      if (!debouncedHandle || debouncedHandle.length < 3) return;
      setCheckingHandle(true);
      setHandleError("");
      
      const clean = debouncedHandle.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (clean !== debouncedHandle) {
         setCreatorData(prev => ({ ...prev, handle: clean }));
         setCheckingHandle(false);
         return; 
      }

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabaseAuth.from('profiles').select('id').eq('handle', clean).single();
      if (data) setHandleError("Handle is already taken.");
      setCheckingHandle(false);
    };
    checkHandle();
  }, [debouncedHandle]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: 'profile' | 'cover' | 'portfolio') => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (field === 'profile') setCreatorData({ ...creatorData, profileImage: files[0] });
      else if (field === 'cover') setCreatorData({ ...creatorData, coverPhotos: [...creatorData.coverPhotos, ...files].slice(0, 3) });
      else if (field === 'portfolio') setCreatorData({ ...creatorData, portfolio: [...creatorData.portfolio, ...files] });
    }
  };

  // --- FINAL SUBMIT ---
  const handleFinalSubmit = async (dataOverride?: any) => {
    setLoading(true);
    try {
      if (!user) throw new Error("No user found");

      const token = await getToken({ template: 'supabase' });
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const finalData = { ...creatorData, ...dataOverride };

      const uploadFileAuth = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
        const { error } = await supabaseAuth.storage.from('creator-assets').upload(fileName, file);
        if (error) throw error;
        const { data } = supabaseAuth.storage.from('creator-assets').getPublicUrl(fileName);
        return data.publicUrl;
      };

      if (role === 'brand') {
         // Brand Logic
      } else {
        let avatarUrl = finalData.profileImage ? await uploadFileAuth(finalData.profileImage) : null;
        
        const coverUrls = [];
        for (const file of finalData.coverPhotos) coverUrls.push(await uploadFileAuth(file));

        const portfolioUrls = [];
        for (const file of finalData.portfolio) portfolioUrls.push(await uploadFileAuth(file));

        const totalFollowers = finalData.socials 
            ? Object.values(finalData.socials as any).reduce((acc: number, curr: any) => acc + (parseInt(curr.followers) || 0), 0)
            : 0;

        const { error } = await supabaseAuth.from('profiles').insert([{ 
            id: user.id, 
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
            handle: finalData.handle || user.username, 
            role: 'creator',
            
            bio: finalData.bio,
            job_title: finalData.professional_title,
            location: finalData.location_city,
            gender: finalData.gender,
            ethnicity: finalData.ethnicity,
            dob: finalData.dob ? finalData.dob : null,
            niches: finalData.niches,
            follower_count_total: totalFollowers,
            
            avatar_url: avatarUrl,
            cover_photos: coverUrls,
            portfolio_urls: portfolioUrls,
            socials: finalData.socials,
            pricing_packages: { packages: finalData.packages, rates: finalData.rates },
            phone: finalData.phone_number ? `${finalData.phone_country_code}${finalData.phone_number}` : null,
            
            verified: identityStatus === 'verified',
            onboarding_status: 'complete'
        }]);

        if (error) throw error;
        setUserRole('creator');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      alert(`Error saving profile: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCreatorStep = () => {
    switch(step) {
      // Step 0: Location
      case 0: return (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div><h2 className="text-3xl font-bold text-gray-900">Where are you based?</h2><p className="text-gray-500 mt-2">Brands often search for creators in specific cities.</p></div>
           <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">City</label>
               <LocationSearch onSelect={(location: string) => setCreatorData({...creatorData, location_city: location})} className="w-full"/>
           </div>
           <div className="pt-8">
               <button onClick={nextStep} disabled={!creatorData.location_city} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform disabled:opacity-50">Continue</button>
           </div>
         </div>
      );

      // Step 1: Details
      case 1: return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div><h2 className="text-3xl font-bold text-gray-900">Claim your Link</h2><p className="text-gray-500 mt-2">Choose the unique URL brands will use to book you.</p></div>
             <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Your Handle</label>
                   <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">oncue.com/</span>
                       <input type="text" placeholder="yourname" value={creatorData.handle} onChange={e => setCreatorData({...creatorData, handle: e.target.value.toLowerCase().replace(/\s/g, '')})} className={`w-full pl-32 p-4 rounded-xl border-2 text-lg bg-white outline-none font-bold transition-colors ${handleError ? 'border-red-300 focus:border-red-500 text-red-600' : 'border-gray-200 focus:border-black text-black'}`} />
                       {checkingHandle && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-gray-400" size={20}/></div>}
                       {!checkingHandle && !handleError && creatorData.handle.length > 2 && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Check className="text-green-500" size={20}/></div>}
                   </div>
                   {handleError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{handleError}</p>}
                </div>
                <div><label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Professional Title</label><input type="text" placeholder="e.g. Lifestyle Vlogger" value={creatorData.professional_title} onChange={e => setCreatorData({...creatorData, professional_title: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black transition-colors" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Gender</label><select value={creatorData.gender} onChange={e => setCreatorData({...creatorData, gender: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black appearance-none"><option value="">Select</option><option value="Female">Female</option><option value="Male">Male</option><option value="Non-binary">Non-binary</option></select></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Ethnicity</label><select value={creatorData.ethnicity} onChange={e => setCreatorData({...creatorData, ethnicity: e.target.value})} className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black appearance-none"><option value="">Select</option>{ETHNICITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                </div>
                <div><label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Niches (Max 2)</label><div className="grid grid-cols-3 gap-3">{NICHE_OPTIONS.map(niche => (<button key={niche} onClick={() => { const newNiches = toggleSelection(creatorData.niches, niche); if (newNiches.length <= 2) setCreatorData({...creatorData, niches: newNiches}); }} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${creatorData.niches.includes(niche) ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}>{niche}</button>))}</div></div>
             </div>
             <div className="pt-8 flex justify-between items-center">
                 <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
                 <button onClick={nextStep} disabled={!creatorData.professional_title || !!handleError || !creatorData.handle} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition-transform">Continue</button>
             </div>
          </div>
      );

      // Step 2: Socials
      case 2: return (<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"><div><h2 className="text-3xl font-bold text-gray-900">Social Channels</h2><p className="text-gray-500 mt-2">Add your handle and audience size.</p></div><div className="text-gray-900 space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">{SOCIAL_PLATFORMS.map((platform) => { const currentData = (creatorData.socials as any)[platform.id] || { handle: '', followers: '' }; return (<div key={platform.id} className="p-4 border-2 border-gray-100 rounded-xl bg-white hover:border-gray-300 transition-colors"><div className="flex items-center gap-3 mb-3"><platform.icon className="w-5 h-5 text-black" /><span className="font-bold capitalize">{platform.label}</span></div><div className="flex gap-3"><div className="flex-1 relative"><span className="text-gray-600 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">@</span><input type="text" placeholder="username" value={currentData.handle} onChange={(e) => { const updatedSocials = { ...creatorData.socials, [platform.id]: { ...currentData, handle: e.target.value } }; setCreatorData({ ...creatorData, socials: updatedSocials }); }} className="text-gray-600 w-full pl-7 p-3 bg-gray-50 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 ring-black/5 transition" /></div><div className="w-1/3 relative"><Users className="text-gray-100 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" /><input type="text" placeholder="10k" value={currentData.followers} onChange={(e) => { const updatedSocials = { ...creatorData.socials, [platform.id]: { ...currentData, followers: e.target.value } }; setCreatorData({ ...creatorData, socials: updatedSocials }); }} className="w-full pl-8 p-3 bg-gray-50 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 ring-black/5 transition" /></div></div></div>); })}</div><div className="pt-8 flex justify-between items-center"><button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button><button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform">Continue</button></div></div>);
      
      // Step 3: Identity/Bio
      case 3: return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div><h2 className="text-3xl font-bold text-gray-900">Your Identity</h2><p className="text-gray-500 mt-2">How you appear to brands.</p></div>
             <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Bio</label>
                    <textarea value={creatorData.bio} onChange={e => setCreatorData({...creatorData, bio: e.target.value})} placeholder="Tell us about your content style..." className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black h-32 resize-none transition-colors" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-sm">{creatorData.profileImage ? (<img src={URL.createObjectURL(creatorData.profileImage)} alt="Profile" className="w-full h-full object-cover" />) : <User className="text-gray-400 w-8 h-8" />}</div>
                    <label className="cursor-pointer bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-xl font-bold text-sm transition-transform">Upload Avatar <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'profile')} /></label>
                </div>
                <div>
                   <label className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2 block">Cover Photos (Max 3)</label>
                   <div className="grid grid-cols-3 gap-3">
                     {creatorData.coverPhotos.map((file, idx) => (<div key={idx} className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden relative shadow-sm"><img src={URL.createObjectURL(file)} alt="Cover" className="w-full h-full object-cover" /></div>))}
                     {creatorData.coverPhotos.length < 3 && (<label className="aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 text-gray-400 transition-colors"><Plus className="w-8 h-8 mb-2" /><span className="text-xs font-bold uppercase">Add Photo</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} /></label>)}
                   </div>
                </div>
             </div>
             <div className="pt-8 flex justify-between items-center"><button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button><button onClick={nextStep} disabled={!creatorData.bio} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition-transform">Continue</button></div>
          </div>
      );

      // Step 4: Portfolio (Fixed: Video Thumbnails)
      case 4: return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div><h2 className="text-3xl font-bold text-gray-900">Portfolio</h2><p className="text-gray-500 mt-2">Upload your best work (Max 50MB for video).</p></div>
             <div className="grid grid-cols-3 gap-3">
                {creatorData.portfolio.map((file, idx) => {
                   const objectUrl = URL.createObjectURL(file);
                   const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i);
                   return (
                     <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 shadow-sm group">
                        {isVideo ? (
                           <video src={objectUrl} className="w-full h-full object-cover" muted playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}/>
                        ) : (
                           <img src={objectUrl} alt="Portfolio" className="w-full h-full object-cover" />
                        )}
                        <button onClick={() => { const newPort = creatorData.portfolio.filter((_, i) => i !== idx); setCreatorData({...creatorData, portfolio: newPort}); }} className="absolute top-2 right-2 bg-white text-black p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><X size={14} /></button>
                     </div>
                   );
                 })}
                 <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 text-gray-400 hover:text-black transition-all group"><Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" /><span className="text-xs font-bold uppercase">Upload Media</span><input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleFileChange(e, 'portfolio')} /></label>
             </div>
             <div className="pt-8 flex justify-between items-center"><button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button><button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform">Continue</button></div>
          </div>
      );

      // Step 5: Pricing
      case 5: return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div><h2 className="text-3xl font-bold text-gray-900">Monetization</h2><p className="text-gray-500 mt-2">Set your baseline. We'll handle the rest.</p></div>
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Hourly Rate ($)</label>
              <div className="text-gray-900 relative mt-2"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-6 h-6" /><input type="number" placeholder="100" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-black outline-none text-3xl font-bold text-black bg-white transition-colors" /></div>
            </div>
            {baseRate && parseInt(baseRate) > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900">Suggested Packages</h3>
                <div className="grid gap-4">
                  {PACKAGE_TEMPLATES.map((template) => {
                    const isSelected = selectedPackages.some((p) => p.id === template.id);
                    const suggestedPrice = Math.round(parseInt(baseRate) * template.multiplier);
                    const currentPrice = isSelected ? selectedPackages.find(p => p.id === template.id).price : suggestedPrice;
                    return (
                      <div key={template.id} className={`text-gray-900 relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "border-black bg-gray-50 shadow-lg scale-[1.02]" : "border-gray-100 hover:border-gray-300"}`} onClick={() => { if (isSelected) setSelectedPackages(selectedPackages.filter((p) => p.id !== template.id)); else setSelectedPackages([...selectedPackages, { ...template, price: suggestedPrice }]); }}>
                        <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${isSelected ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}><template.icon size={18} /></div><h4 className="font-bold text-lg">{template.title}</h4></div>{isSelected && <Check size={20} className="text-green-600" />}</div>
                        {isSelected ? (
                            <div className="mt-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wide">Your Price ($)</label>
                                <input type="number" value={currentPrice} onChange={(e) => { const newArr = selectedPackages.map(p => p.id === template.id ? { ...p, price: e.target.value } : p); setSelectedPackages(newArr); }} className="w-full mt-1 p-3 rounded-lg border-2 border-gray-200 font-bold text-black text-lg focus:border-black outline-none" />
                            </div>
                        ) : (
                            <div className="text-gray-400 font-medium pl-12">Suggested: ${suggestedPrice}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="pt-8 flex justify-between items-center">
              <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
              <button onClick={() => { setCreatorData({...creatorData, packages: selectedPackages.map(p=>p.title), rates: selectedPackages.reduce((acc,p)=>({...acc,[p.title]:p.price}),{})}); nextStep(); }} disabled={selectedPackages.length === 0} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition-transform">Continue</button>
            </div>
          </div>
      );

      // Step 6: Contact Info (OPTIONAL / SKIP)
      case 6: return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
                <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-500 mt-2">Add your number to get instant alerts for new bookings.</p>
             </div>
             
             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                <div className="bg-white p-2 rounded-full h-fit text-blue-600"><BellRing size={20} /></div>
                <div>
                   <h4 className="font-bold text-blue-900 text-sm mb-1">Stay in the loop</h4>
                   <p className="text-blue-800 text-xs leading-relaxed">
                      We send a text the moment a brand requests you. You can skip this for now and add it later in your dashboard.
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                 <div className="flex gap-4">
                     <select value={creatorData.phone_country_code} onChange={e => setCreatorData({...creatorData, phone_country_code: e.target.value})} className="w-24 border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black">
                        <option value="+1">🇺🇸 +1</option><option value="+61">🇦🇺 +61</option><option value="+44">🇬🇧 +44</option>
                     </select>
                     <input type="tel" placeholder="412 345 678" value={creatorData.phone_number} onChange={e => setCreatorData({...creatorData, phone_number: e.target.value})} className="flex-1 border-2 border-gray-200 p-4 rounded-xl text-lg bg-white focus:border-black outline-none text-black" />
                 </div>
             </div>

             <div className="pt-8 flex justify-between items-center">
                 <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
                 <div className="flex items-center gap-4">
                    {!creatorData.phone_number && (
                        <button onClick={nextStep} className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors uppercase tracking-widest">Skip for now</button>
                    )}
                    <button onClick={nextStep} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform">
                        {creatorData.phone_number ? "Continue" : "Skip"}
                    </button>
                 </div>
             </div>
          </div>
      );

      // Step 7: Identity Verification (CARD ELEMENT)
      case 7: return (
          <Elements stripe={stripePromise}>
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div><h2 className="text-3xl font-bold text-gray-900">Final Verification</h2><p className="text-gray-500 mt-2">Verify a card to prove you are real. (No charge).</p></div>
                 
                 {identityStatus === 'verified' ? (
                     <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md text-green-600 mb-2"><CheckCircle2 size={40} /></div>
                        <h3 className="text-2xl font-bold text-green-800">Identity Verified</h3>
                        <p className="text-green-700">You are ready to launch.</p>
                     </div>
                 ) : (
                     <CardVerificationForm onVerified={() => setIdentityStatus('verified')} />
                 )}

                 <div className="pt-8 flex justify-between items-center">
                     <button onClick={prevStep} className="text-gray-500 font-bold text-sm hover:text-black uppercase tracking-widest">Back</button>
                     <button onClick={() => handleFinalSubmit()} disabled={loading || identityStatus !== 'verified'} className="bg-black text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-gray-900 shadow-xl transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">{loading ? <Loader2 className="animate-spin" /> : "Finish & Launch"}</button>
                 </div>
             </div>
          </Elements>
      );

      default: return null;
    }
  };

  // ... (Keep Main Layout Logic Unchanged) ...
  if (!role) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
         <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black mb-8">Choose your path</h1>
          <div className="grid md:grid-cols-2 gap-6">
            <button onClick={() => setShowInviteModal(true)} className="group p-10 rounded-[2rem] border-2 border-gray-100 hover:border-gray-200 text-left bg-gray-50 opacity-90"><div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-6 text-gray-400"><Lock className="w-8 h-8" /></div><h3 className="text-2xl font-bold text-gray-400 mb-2">I'm a Brand</h3><p className="text-red-500 font-bold text-xs uppercase tracking-widest bg-red-50 inline-block px-2 py-1 rounded">Invite Only</p></button>
            <button onClick={() => setRole('creator')} className="group p-10 rounded-[2rem] border-2 border-gray-100 hover:border-black hover:shadow-2xl text-left bg-white"><div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors"><User className="w-8 h-8" /></div><h3 className="text-2xl font-bold text-black mb-2">I'm a Creator</h3><p className="text-gray-400 font-medium">Monetizing content</p></button>
          </div>
        </div>
        {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />
              <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                 <button onClick={() => setShowInviteModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
                 <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg"><Lock size={32} /></div>
                 <h3 className="text-3xl font-serif font-bold text-center mb-2">Private Access</h3>
                 <p className="text-gray-500 text-center mb-8 leading-relaxed">Brand accounts are currently <strong>Invite Only</strong> to ensure high-quality matches for our creators.</p>
                 <a href="mailto:partnerships@oncue.com?subject=Brand%20Waitlist%20Request" className="block w-full"><button className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"><Mail size={18} /> Join Waitlist</button></a>
              </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className="hidden lg:flex w-1/3 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10"><h1 className="text-3xl font-bold mb-2 tracking-tight">Setup Profile</h1><p className="text-gray-400 text-sm">Complete these steps to start accepting bookings.</p><div className="space-y-6 mt-12">{['Location', 'Details', 'Socials', 'Identity', 'Portfolio', 'Pricing', 'Contact', 'Verify'].map((label, idx) => (<div key={label} className={`flex items-center gap-4 transition-all duration-500 ${idx === step ? 'opacity-100 translate-x-2' : 'opacity-30'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${idx <= step ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-500'}`}>{idx + 1}</div><span className="font-bold text-lg tracking-wide">{label}</span></div>))}</div></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>
      <div className="flex-1 overflow-y-auto"><div className="min-h-full flex items-center justify-center p-8 lg:p-16"><div className="max-w-xl w-full">{role === 'creator' ? renderCreatorStep() : <div className="text-center font-bold">Brand Flow Under Construction</div>}</div></div></div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}