"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function EditProfilePage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    price_rate: "",
    location: "",
    internet_speed: "",
    tech_setup: [] as string[]
  });

  // Fetch existing data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          price_rate: data.price_rate || "",
          location: data.location || "",
          internet_speed: data.internet_speed || "",
          tech_setup: data.tech_setup || []
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update(formData).eq('id', user?.id);
    setSaving(false);
    alert("Profile Updated!");
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-serif font-bold mb-6">Edit Profile</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        
        <div>
           <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Display Name</label>
           <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" />
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Bio</label>
           <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50 h-24" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hourly Rate</label>
              <input value={formData.price_rate} onChange={e => setFormData({...formData, price_rate: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" />
           </div>
           <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Location</label>
              <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" />
           </div>
        </div>

        <button disabled={saving} className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800">
           {saving ? <Loader2 className="animate-spin" /> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}