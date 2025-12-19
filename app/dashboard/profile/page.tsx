"use client";
import React, { useEffect, useState, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs"; // <--- Added useAuth
import { createClient } from "@supabase/supabase-js"; // <--- Added createClient
import { 
  Loader2, Camera, MapPin, Globe, Instagram, Youtube, Twitch, Twitter, 
  Smartphone, Upload, X, Plus, Save, ChevronLeft, Eye, DollarSign, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- CONSTANTS ---
const SOCIAL_PLATFORMS = [
  { id: 'instagram', icon: Instagram },
  { id: 'tiktok', icon: Smartphone },
  { id: 'youtube', icon: Youtube },
  { id: 'twitch', icon: Twitch },
  { id: 'twitter', icon: Twitter },
  { id: 'website', icon: Globe },
];

export default function EditProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth(); // <--- Get Token Function
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 
  const [uploadingSection, setUploadingSection] = useState<'avatar' | 'cover' | 'portfolio' | null>(null);
  
  // File Input Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    name: "",
    handle: "",
    bio: "",
    job_title: "",
    location: "",
    price_rate: "", 
    avatar_url: "",
    cover_photos: [],
    portfolio_urls: [],
    niches: [],
    socials: {}
  });

  // --- HELPER: GET AUTH CLIENT ---
  const getSupabaseAuth = async () => {
      const token = await getToken({ template: 'supabase' });
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
  };

  // 1. Fetch Data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      // We can use the guest client for FETCHING if RLS allows 'Select' for everyone (which it does)
      const supabaseAuth = await getSupabaseAuth(); // Use Auth just to be safe
      const { data, error } = await supabaseAuth.from('profiles').select('*').eq('id', user.id).single();
      
      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        // Safe defaults
        let initialRate = data.price_rate;
        if (!initialRate && data.pricing_packages?.rates) {
             const rates = Object.values(data.pricing_packages.rates);
             if (rates.length > 0) initialRate = rates[0]; 
        }

        setFormData({
          ...data,
          socials: data.socials || {},
          niches: data.niches || [],
          cover_photos: data.cover_photos || [],
          portfolio_urls: data.portfolio_urls || [],
          price_rate: initialRate || "" 
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // 2. Generic Image Upload Handler (SECURE)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover' | 'portfolio') => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    setUploadingSection(field);

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = 'creator-assets';

      // USE AUTH CLIENT
      const supabaseAuth = await getSupabaseAuth();
      
      const { error: uploadError } = await supabaseAuth.storage.from(bucket).upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAuth.storage.from(bucket).getPublicUrl(fileName);

      if (field === 'avatar') {
        setFormData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      } else if (field === 'cover') {
        setFormData((prev: any) => {
            const newCovers = [...(prev.cover_photos || [])];
            if (newCovers.length > 0) newCovers[0] = publicUrl;
            else newCovers.push(publicUrl);
            return { ...prev, cover_photos: newCovers };
        });
      } else if (field === 'portfolio') {
        setFormData((prev: any) => ({ ...prev, portfolio_urls: [...(prev.portfolio_urls || []), publicUrl] }));
      }

    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingSection(null);
      e.target.value = ""; 
    }
  };

  // 3. Save Changes (SECURE)
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const payload = {
          name: formData.name,
          bio: formData.bio,
          job_title: formData.job_title,
          location: formData.location,
          price_rate: formData.price_rate === "" ? null : Number(formData.price_rate),
          avatar_url: formData.avatar_url,
          cover_photos: formData.cover_photos,
          portfolio_urls: formData.portfolio_urls,
          niches: Array.isArray(formData.niches) ? formData.niches : [], 
          socials: formData.socials || {}, 
          updated_at: new Date().toISOString()
      };

      // USE AUTH CLIENT
      const supabaseAuth = await getSupabaseAuth();

      const { data, error } = await supabaseAuth
          .from('profiles')
          .update(payload)
          .eq('id', user.id)
          .select(); // Check for rows

      if (error) throw error;
      
      if (!data || data.length === 0) {
          throw new Error("Update succeeded but no rows changed. ID mismatch likely.");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000); 
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans relative">
      
      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md text-white px-8 py-4 rounded-full shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-1"><CheckCircle2 size={16} className="text-white"/></div>
                <span className="font-bold">Changes saved successfully</span>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 px-6 py-4 flex justify-between items-center transition-all">
         <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                <ChevronLeft size={24} />
            </Link>
            <h1 className="font-bold text-lg hidden md:block">Edit Profile</h1>
         </div>
         <div className="flex gap-3">
             <Link href={`/creator/${formData.handle || user.id}`} target="_blank">
                <button className="px-4 py-2 text-sm font-bold border border-gray-200 rounded-full hover:bg-gray-100 flex items-center gap-2 transition-colors">
                   <Eye size={16}/> <span className="hidden md:inline">View Public</span>
                </button>
             </Link>
             <button 
               onClick={handleSave}
               disabled={saving}
               className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg"
             >
               {saving ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> Save Changes</>}
             </button>
         </div>
      </div>

      {/* HERO */}
      <div className="pt-20">
         <div className="relative h-[300px] bg-gray-200 group cursor-pointer overflow-hidden" onClick={() => coverInputRef.current?.click()}>
            <img src={formData.cover_photos[0] || ""} className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition duration-500" />
            
            {uploadingSection === 'cover' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><Loader2 className="animate-spin text-white w-10 h-10" /></div>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
               <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Camera size={16}/> Change Cover
               </div>
            </div>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'cover')} />
         </div>

         <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10 flex gap-8">
             <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 relative">
                   <img src={formData.avatar_url} className="w-full h-full object-cover" />
                   {uploadingSection === 'avatar' && (
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><Loader2 className="animate-spin text-white w-8 h-8" /></div>
                   )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition">
                   <Camera className="text-white" size={24} />
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
             </div>
         </div>
      </div>

      {/* FORMS */}
      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 block">Display Name</label>
                  <input 
                     value={formData.name} 
                     onChange={e => setFormData({ ...formData, name: e.target.value })}
                     className="w-full text-3xl font-bold border-b-2 border-transparent hover:border-gray-200 focus:border-black outline-none bg-transparent transition-colors placeholder-gray-300 py-1"
                     placeholder="Your Name"
                  />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400 block">Job Title</label>
                    <input 
                        value={formData.job_title} 
                        onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full text-lg font-medium border-b border-gray-100 hover:border-gray-300 focus:border-black outline-none py-2 transition"
                        placeholder="e.g. Content Creator"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400 block">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-0 top-3 text-gray-400" size={16} />
                        <input 
                            value={formData.location} 
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full pl-6 text-lg font-medium border-b border-gray-100 hover:border-gray-300 focus:border-black outline-none py-2 transition"
                            placeholder="e.g. Melbourne, AU"
                        />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 block">Bio</label>
                  <textarea 
                     value={formData.bio} 
                     onChange={e => setFormData({ ...formData, bio: e.target.value })}
                     className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-black outline-none min-h-[120px] resize-none"
                     placeholder="Tell brands about yourself..."
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 block">Niches (Comma separated)</label>
                  <input 
                     value={formData.niches.join(', ')} 
                     onChange={e => setFormData({ ...formData, niches: e.target.value.split(',').map((s: string) => s.trim()) })}
                     className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:border-black outline-none"
                     placeholder="Tech, Beauty, Lifestyle"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                     {formData.niches.filter((n: string) => n).map((n: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">{n}</span>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-lg mb-4">Social Stats</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOCIAL_PLATFORMS.map(platform => {
                     const current = formData.socials[platform.id] || { handle: '', followers: '' };
                     return (
                        <div key={platform.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors bg-white">
                           <div className="bg-gray-100 p-2 rounded-full text-black"><platform.icon size={18}/></div>
                           <div className="flex-1">
                              <input 
                                 placeholder={`${platform.id} handle`}
                                 value={current.handle}
                                 onChange={e => setFormData({
                                    ...formData,
                                    socials: { ...formData.socials, [platform.id]: { ...current, handle: e.target.value } }
                                 })}
                                 className="w-full text-sm font-bold outline-none mb-1 bg-transparent"
                              />
                              <input 
                                 placeholder="e.g. 42.9k"
                                 value={current.followers}
                                 onChange={e => setFormData({
                                    ...formData,
                                    socials: { ...formData.socials, [platform.id]: { ...current, followers: e.target.value } }
                                 })}
                                 className="w-full text-xs text-gray-500 outline-none bg-transparent"
                              />
                           </div>
                        </div>
                     )
                  })}
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Portfolio</h3>
                  <button onClick={() => portfolioInputRef.current?.click()} className="text-sm font-bold bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-800 transition">
                     <Plus size={16} /> Add Media
                  </button>
                  <input type="file" multiple ref={portfolioInputRef} className="hidden" accept="image/*,video/*" onChange={e => handleImageUpload(e, 'portfolio')} />
               </div>

               <div className="grid grid-cols-3 gap-4">
                  {formData.portfolio_urls.map((url: string, i: number) => (
                     <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group border border-gray-100">
                        {url.endsWith('.mp4') ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} className="w-full h-full object-cover" />}
                        <button onClick={() => {
                              const newUrls = formData.portfolio_urls.filter((_: any, idx: number) => idx !== i);
                              setFormData({ ...formData, portfolio_urls: newUrls });
                           }} className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition hover:scale-110 z-10"><X size={14} /></button>
                     </div>
                  ))}
                  
                  {uploadingSection === 'portfolio' && (
                      <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 animate-pulse"><Loader2 className="animate-spin text-gray-400" /></div>
                  )}

                  <div onClick={() => portfolioInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-black hover:text-black transition hover:bg-gray-50">
                     <Upload size={24} className="mb-2"/><span className="text-xs font-bold uppercase">Upload</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm sticky top-24">
               <h3 className="font-bold text-lg mb-6">Rates & Settings</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Hourly Base Rate ($)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={18} />
                        <input type="number" value={formData.price_rate} onChange={e => setFormData({ ...formData, price_rate: e.target.value })} className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-xl font-bold text-xl border-2 border-transparent focus:border-black outline-none transition" placeholder="150" />
                     </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100"><p className="text-xs text-gray-400 mb-2 leading-relaxed">To edit your specific packages (Shoutout, Stream, etc), please contact support. We are building a package editor for you soon!</p></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}