/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Navigation, Info, ChevronRight, Loader2, Compass } from "lucide-react";
import { temples, Temple } from "./data/temples";
import { calculateDistance } from "./utils/distance";
import { geocodeLocation, Coordinates } from "./services/geocoding";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [userLocation, setUserLocation] = useState<string>("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortedTemples, setSortedTemples] = useState<(Temple & { distance: number })[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userLocation.trim()) return;

    setIsLoading(true);
    setError(null);
    
    const result = await geocodeLocation(userLocation);
    
    if (result) {
      setCoords(result);
      const withDistance = temples.map(t => ({
        ...t,
        distance: calculateDistance(result.lat, result.lng, t.lat, t.lng)
      })).sort((a, b) => a.distance - b.distance);
      
      setSortedTemples(withDistance);
    } else {
      setError("Could not find that location. Please try again.");
    }
    setIsLoading(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude, name: "Your Current Location" });
        
        const withDistance = temples.map(t => ({
          ...t,
          distance: calculateDistance(latitude, longitude, t.lat, t.lng)
        })).sort((a, b) => a.distance - b.distance);
        
        setSortedTemples(withDistance);
        setIsLoading(false);
      },
      (err) => {
        setError("Location access denied. Please enter manually.");
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Compass size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-800 leading-none">Divya Desam</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mt-1">108 Sacred Shrines</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Search Section */}
        <section className="mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <h2 className="text-2xl font-serif italic mb-4 text-stone-800">Where are you starting from?</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter city (e.g. Madurai, Srirangam)"
                  className="w-full pl-12 pr-4 py-4 bg-stone-100 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 transition-all outline-none text-lg"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Find Temples"}
                </button>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLoading}
                  className="w-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center hover:bg-amber-200 transition-colors disabled:opacity-50"
                  title="Use my current location"
                >
                  <MapPin size={24} />
                </button>
              </div>
            </form>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-red-500 text-sm font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {coords ? (
            <motion.section
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">
                  Shrines near {coords.name}
                </h3>
                <span className="text-xs font-medium text-stone-400">
                  Sorted by distance
                </span>
              </div>

              <div className="grid gap-4">
                {sortedTemples.map((temple, index) => (
                  <TempleCard key={temple.id} temple={temple} index={index} />
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
                <Navigation size={40} />
              </div>
              <h3 className="text-xl font-serif italic text-stone-600">Enter your location (e.g. Madurai) to discover the sacred paths</h3>
              <p className="text-stone-400 mt-2 max-w-xs mx-auto">Explore the 108 Divya Desams and their divine stories.</p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex justify-end">
          <div className="bg-white/80 backdrop-blur-md border border-stone-200 px-4 py-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 text-xs font-medium text-stone-600">
            <Info size={14} className="text-amber-600" />
            <span>Data from Guide to 108 Divya Desams</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TempleCard({ temple, index }: { temple: Temple & { distance: number }, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      <div 
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            {temple.group}
          </span>
          <span className="text-xs font-mono font-bold text-stone-400">
            #{temple.id}
          </span>
        </div>
        
        <h4 className="text-xl font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
          {temple.name}
        </h4>
        
        <div className="flex items-center gap-1 text-stone-500 mt-1 mb-4">
          <MapPin size={14} />
          <span className="text-sm font-medium">{temple.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-light text-stone-900">
              {temple.distance === Infinity ? "Celestial" : temple.distance.toFixed(1)}
              <span className="text-xs font-bold uppercase ml-1 opacity-40">
                {temple.distance === Infinity ? "" : "km"}
              </span>
            </div>
          </div>
          
          <div className={cn(
            "w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 transition-transform duration-300",
            isExpanded && "rotate-90 bg-amber-100 text-amber-600"
          )}>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-100 bg-stone-50/50"
          >
            <div className="p-5 text-sm leading-relaxed text-stone-600">
              <p>{temple.description}</p>
              <div className="mt-4 flex gap-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name + " " + temple.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-stone-200 px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors flex items-center gap-2"
                >
                  <Navigation size={12} />
                  Open in Maps
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
