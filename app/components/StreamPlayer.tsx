import React from 'react';
import { ExternalLink } from 'lucide-react';

interface StreamPlayerProps {
  url: string;
  isLive?: boolean;
}

export default function StreamPlayer({ url, isLive = false }: StreamPlayerProps) {
  
  // 1. Helper to detect type and format URL
  const getStreamSource = (inputUrl: string) => {
    if (!inputUrl) return null;

    // YOUTUBE (The Best Option for Consoles)
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      let videoId = '';
      if (inputUrl.includes('v=')) videoId = inputUrl.split('v=')[1].split('&')[0];
      else if (inputUrl.includes('youtu.be/')) videoId = inputUrl.split('youtu.be/')[1].split('?')[0];
      
      return {
        type: 'youtube',
        src: `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&playsinline=1&rel=0`
      };
    }

    // INSTAGRAM (Fallback)
    if (inputUrl.includes('instagram.com')) {
      const cleanUrl = inputUrl.split('?')[0].replace(/\/$/, "");
      return {
        type: 'instagram',
        src: cleanUrl.includes('/embed') ? cleanUrl : `${cleanUrl}/embed`
      };
    }

    // TWITCH (Good for gaming/tech)
    if (inputUrl.includes('twitch.tv')) {
      const channel = inputUrl.split('/').pop();
      return {
        type: 'twitch',
        src: `https://player.twitch.tv/?channel=${channel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
      };
    }

    return { type: 'unknown', src: inputUrl };
  };

  const stream = getStreamSource(url);

  if (!stream) return <div className="bg-gray-900 w-full h-full flex items-center justify-center text-gray-500">No Signal</div>;

  return (
    <div className="w-full h-full relative group bg-black">
      
      {/* Pop-out Button (Always available) */}
      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
         <a 
           href={url} 
           target="_blank" 
           rel="noreferrer"
           className="bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/10"
         >
           <ExternalLink size={12} /> Pop Out
         </a>
      </div>

      {/* The Player */}
      <iframe 
        src={stream.src}
        className="w-full h-full object-cover"
        frameBorder="0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        // Twitch/YouTube need standard sandbox. Instagram is strict.
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
      
      {/* Instagram Warning Overlay */}
      {stream.type === 'instagram' && (
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <span className="bg-black/50 text-[10px] text-gray-400 px-2 py-1 rounded">
            Instagram may force new window on click
          </span>
        </div>
      )}
    </div>
  );
}