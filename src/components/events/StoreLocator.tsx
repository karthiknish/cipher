"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Envelope, 
  NavigationArrow,
  Storefront,
  Check,
  CaretDown,
  Lightning,
  Package
} from "@phosphor-icons/react";
import { StoreLocation, useLocalScene } from "@/context/LocalSceneContext";

interface StoreLocatorProps {
  onSelectStore?: (store: StoreLocation) => void;
  selectedStoreId?: string;
  mode?: "selector" | "display";
}

const STORE_TYPE_CONFIG = {
  flagship: { label: "Flagship Store", color: "bg-black" },
  popup: { label: "Pop-Up", color: "bg-purple-500" },
  partner: { label: "Partner Store", color: "bg-blue-500" },
};

export function StoreLocator({ 
  onSelectStore, 
  selectedStoreId,
  mode = "display"
}: StoreLocatorProps) {
  const { stores, getPickupStores, userLocation, requestLocationPermission } = useLocalScene();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const displayStores = mode === "selector" ? getPickupStores() : stores.filter(s => s.isActive);

  const getDayName = (index: number): string => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[index];
  };

  const getCurrentDayHours = (store: StoreLocation) => {
    const today = getDayName(new Date().getDay());
    const hours = store.hours[today];
    if (hours === "closed") return "Closed today";
    if (typeof hours === "object") {
      return `${hours.open} - ${hours.close}`;
    }
    return "Hours unavailable";
  };

  const isOpenNow = (store: StoreLocation): boolean => {
    const today = getDayName(new Date().getDay());
    const hours = store.hours[today];
    if (hours === "closed" || typeof hours !== "object") return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(hours.open.replace(":", ""));
    const closeTime = parseInt(hours.close.replace(":", ""));
    
    return currentTime >= openTime && currentTime < closeTime;
  };

  const handleRequestLocation = async () => {
    setLocationRequested(true);
    await requestLocationPermission();
  };

  const getDirectionsUrl = (store: StoreLocation) => {
    const address = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

  return (
    <div className="space-y-4">
      {/* Location Enable Banner */}
      {!userLocation?.enabled && !locationRequested && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <p className="text-sm text-gray-600">Enable location for distance info</p>
          </div>
          <button 
            onClick={handleRequestLocation}
            className="text-sm font-medium hover:underline"
          >
            Enable
          </button>
        </motion.div>
      )}

      {/* Store List */}
      <div className="space-y-3">
        {displayStores.map((store) => {
          const isSelected = selectedStoreId === store.id;
          const isExpanded = expandedStore === store.id;
          const typeConfig = STORE_TYPE_CONFIG[store.type];
          const isOpen = isOpenNow(store);
          
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`border transition ${
                isSelected 
                  ? "border-black bg-gray-50" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Main Row */}
              <div 
                className={`p-4 ${mode === "selector" ? "cursor-pointer" : ""}`}
                onClick={() => mode === "selector" && onSelectStore?.(store)}
              >
                <div className="flex gap-4">
                  {/* Store Image */}
                  {store.imageUrl && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={store.imageUrl}
                        alt={store.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{store.name}</h3>
                          <span className={`px-2 py-0.5 text-xs text-white ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{store.address}</p>
                        <p className="text-sm text-gray-500">{store.city}, {store.state} {store.zip}</p>
                      </div>
                      
                      {mode === "selector" && (
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 bg-black flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" weight="bold" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={isOpen ? "text-green-600" : "text-gray-500"}>
                          {isOpen ? "Open now" : getCurrentDayHours(store)}
                        </span>
                      </div>
                      
                      {store.exclusiveProductIds.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-purple-600">
                          <Lightning className="w-4 h-4" />
                          <span>{store.exclusiveProductIds.length} exclusives</span>
                        </div>
                      )}
                      
                      {store.hasPickup && (
                        <div className="flex items-center gap-1.5 text-sm text-blue-600">
                          <Package className="w-4 h-4" />
                          <span>Pickup</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expand/Collapse Button */}
                {mode === "display" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStore(isExpanded ? null : store.id);
                    }}
                    className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-black transition"
                  >
                    {isExpanded ? "Less info" : "More info"}
                    <CaretDown className={`w-4 h-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
              
              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && mode === "display" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="p-4 bg-gray-50 space-y-4">
                      {/* Hours */}
                      <div>
                        <h4 className="text-xs tracking-wider text-gray-500 mb-2">HOURS</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                            const hours = store.hours[day];
                            const isToday = day === getDayName(new Date().getDay());
                            return (
                              <div key={day} className={`flex justify-between ${isToday ? "font-medium" : ""}`}>
                                <span className="capitalize">{day.slice(0, 3)}</span>
                                <span className="text-gray-500">
                                  {hours === "closed" 
                                    ? "Closed" 
                                    : typeof hours === "object" 
                                      ? `${hours.open} - ${hours.close}`
                                      : "N/A"
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Contact */}
                      <div>
                        <h4 className="text-xs tracking-wider text-gray-500 mb-2">CONTACT</h4>
                        <div className="space-y-2 text-sm">
                          <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:underline">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {store.phone}
                          </a>
                          <a href={`mailto:${store.email}`} className="flex items-center gap-2 hover:underline">
                            <Envelope className="w-4 h-4 text-gray-400" />
                            {store.email}
                          </a>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <a
                          href={getDirectionsUrl(store)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900 transition"
                        >
                          <NavigationArrow className="w-4 h-4" />
                          Get Directions
                        </a>
                        {store.hasPickup && (
                          <button
                            onClick={() => onSelectStore?.(store)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 border border-black text-sm font-medium hover:bg-black hover:text-white transition"
                          >
                            <Storefront className="w-4 h-4" />
                            Shop This Store
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {displayStores.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No stores available for pickup</p>
        </div>
      )}
    </div>
  );
}
