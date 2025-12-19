"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface LocationSearchProps {
  onSelect: (address: string) => void;
  defaultValue?: string;
}

export default function LocationSearch({ onSelect, defaultValue = "" }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Ref to handle debouncing (preventing too many API calls)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Search Function (OpenStreetMap / Nominatim)
  const searchLocation = async (text: string) => {
    if (!text || text.length < 3) return;
    
    setIsLoading(true);
    try {
      // Free API endpoint
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

  // Handle Input Change with Debounce
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    // Wait 500ms after user stops typing before calling API (Polite to free servers)
    debounceTimer.current = setTimeout(() => {
        searchLocation(val);
    }, 500);
  };

  const handleSelect = (item: any) => {
    // Format: "Melbourne, Victoria, Australia"
    const city = item.address.city || item.address.town || item.address.village || "";
    const state = item.address.state || "";
    const country = item.address.country || "";
    
    // Clean string builder
    const formatted = [city, state, country].filter(Boolean).join(", ");
    
    setQuery(formatted);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(formatted); // Send back to parent
  };

return (
  <div className="relative w-full">
    <div className="relative">
      <MapPin className="absolute left-4 top-4 text-gray-500" />
        <input
        value={query}
        onChange={handleInput}
        onFocus={() => query.length > 2 && setIsOpen(true)}
        placeholder="Search your city (e.g. Melbourne)"
        className="w-full pl-12 pr-10 py-4 rounded-xl border-2 border-gray-100 focus:border-black outline-none text-lg text-gray-900 placeholder:text-gray-400 transition-all"
        />
      
      {/* Loading Spinner */}
      {isLoading && (
         <div className="absolute right-4 top-4">
           <Loader2 className="animate-spin text-gray-400" />
         </div>
      )}
      
      {/* Clear Button */}
      {!isLoading && query && (
         <button onClick={() => { setQuery(""); onSelect(""); }} className="absolute right-4 top-4 text-gray-400 hover:text-black">
           <X size={20}/>
         </button>
      )}
    </div>

    {/* Dropdown Results */}
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