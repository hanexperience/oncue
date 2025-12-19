"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface LocationSearchProps {
  onSelect: (address: string) => void;
  defaultValue?: string;
  className?: string; // ✅ Added this to fix the TypeScript error
}

export default function LocationSearch({ 
  onSelect, 
  defaultValue = "", 
  className = "" // ✅ Destructured here
}: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const searchLocation = async (text: string) => {
    if (!text || text.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&featuretype=city&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setIsOpen(true);
    } catch (err) {
      console.error("OSM Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
        searchLocation(val);
    }, 500);
  };

  const handleSelect = (item: any) => {
    const city = item.address.city || item.address.town || item.address.village || "";
    const state = item.address.state || "";
    const country = item.address.country || "";
    
    const formatted = [city, state, country].filter(Boolean).join(", ");
    
    setQuery(formatted);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(formatted);
  };

return (
  /* ✅ Applied className to the container so 'w-full' works from the parent */
  <div className={`relative ${className}`}>
    <div className="relative">
      <MapPin className="absolute left-4 top-4 text-gray-500" />
        <input
        value={query}
        onChange={handleInput}
        onFocus={() => query.length > 2 && setIsOpen(true)}
        placeholder="Search your city (e.g. Melbourne)"
        className="w-full pl-12 pr-10 py-4 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-lg text-gray-900 placeholder:text-gray-400 transition-all"
        />
      
      {isLoading && (
         <div className="absolute right-4 top-4">
           <Loader2 className="animate-spin text-gray-400" />
         </div>
      )}
      
      {!isLoading && query && (
         <button onClick={() => { setQuery(""); onSelect(""); }} className="absolute right-4 top-4 text-gray-400 hover:text-black">
           <X size={20}/>
         </button>
      )}
    </div>

    {isOpen && suggestions.length > 0 && (
      <ul className="absolute z-50 w-full bg-white mt-2 rounded-xl border border-gray-100 shadow-xl max-h-60 overflow-y-auto">
        {suggestions.map((item, idx) => (
          <li
            key={idx}
            onClick={() => handleSelect(item)}
            className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none flex items-center gap-3 text-sm"
          >
            <div className="bg-gray-100 p-2 rounded-full"><MapPin size={14} className="text-gray-500"/></div>
            <div className="flex flex-col">
                <span className="font-bold text-black">{item.display_name.split(',')[0]}</span>
                <span className="text-gray-400 text-xs">{item.display_name}</span>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
}