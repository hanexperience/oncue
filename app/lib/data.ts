// app/lib/data.ts

export const INFLUENCERS = [
  { id: "user_fake_sarah_jenkins", name: "Sarah Jenkins", handle: "@sarah.j_style", category: "Fashion", retention: "14m", reliability: "99%", price: "$1,200", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop", live: true },
  { id: 2, name: "TechBreak", handle: "@techbreak_official", category: "Tech", retention: "22m", reliability: "95%", price: "$3,500", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop", live: false },
  { id: 3, name: "Chef Marco", handle: "@marcocooks", category: "Food", retention: "18m", reliability: "92%", price: "$900", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&h=500&fit=crop", live: false },
  { id: 4, name: "FitLife Duo", handle: "@fitlifeduo", category: "Fitness", retention: "35m", reliability: "98%", price: "$2,100", image: "images/sarah.jpg", live: true },
];

export const RUN_OF_SHOW = [
  { time: "00:00", duration: "5m", title: "Warm Up & Greeting", notes: "Ask audience where they are from. Wait for 1k viewers." },
  { time: "05:00", duration: "10m", title: "The Hook (Trivia)", notes: "Start the trivia game. Remind them of the prize." },
  { time: "15:00", duration: "5m", title: "Product Deep Dive", notes: "Focus on the eco-friendly packaging. Show close up." },
  { time: "20:00", duration: "10m", title: "Q&A + Discount Drop", notes: "Answer 3 questions. Reveal code 'LIVE20'." },
];

export const AGENCY_ROSTER = [
  { name: "Sarah Jenkins", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", status: "LIVE", viewers: "12.4k", mood: "Good", time: "08:24" },
  { name: "FitLife Duo", image: "images/sarah.jpg", status: "PREPPING", viewers: "-", mood: "-", time: "-05:00" },
  { name: "TechBreak", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop", status: "OFFLINE", viewers: "-", mood: "-", time: "--:--" },
  { name: "Chef Marco", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop", status: "LATE", viewers: "-", mood: "Risk", time: "+02:00" },
];