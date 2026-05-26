"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  size = "sm", 
  interactive = false, 
  onChange 
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sizeClasses = { sm: "size-4", md: "size-5", lg: "size-6" };
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button 
          key={star} 
          type="button" 
          disabled={!interactive} 
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)} 
          onMouseLeave={() => setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star 
            className={`${sizeClasses[size]} ${
              star <= (hover || rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`} 
          />
        </button>
      ))}
    </div>
  );
}
