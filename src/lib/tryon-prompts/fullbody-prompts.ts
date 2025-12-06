/**
 * Full Body Garment Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateFullBodyPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getFullBodyGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and dress them in the FULL BODY GARMENT from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this garment

GARMENT TYPE: FULL BODY (Dress/Jumpsuit/Romper)
${genderFit}
- Replace the person's entire outfit with this garment
- The garment should cover from shoulders/neckline down to the appropriate length
- Preserve the person's body shape and pose underneath
- Show accurate details like neckline, sleeves (if any), waist, and hem

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Replace all visible clothing with this single garment
3. The person's face, hair, skin tone, expression must be EXACTLY preserved
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the garment must match Image 1's lighting

DO NOT:
- Generate a new person or model
- Show just the garment alone
- Change the person's face, body, or pose
- Change or remove the background

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged.`;
}

function getFullBodyGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Jumpsuits/coveralls should have a straight, utilitarian fit
- Shoulders should be broad and structured
- The torso should be straight without waist definition
- Overalls should fit comfortably over the chest and hips
- Leg openings should be straight or relaxed
- Rompers (if applicable) should have a relaxed, comfortable fit
- One-pieces should have masculine proportions throughout`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- Dresses should follow the body's natural curves
- Account for bust - neckline and bodice should fit properly
- Waist definition is often present - maintain the silhouette
- Various dress styles: A-line, bodycon, fit-and-flare, maxi, etc.
- Jumpsuits can be fitted or relaxed with feminine proportions
- Rompers should have appropriate fit through the bust and hips
- Preserve any visible jewelry or accessories
- Hem length should match the product exactly
- Straps (if any) should sit properly on the shoulders`;
    default:
      return `
FIT CONSIDERATIONS:
- The garment should fit naturally to the person's body shape
- Follow the natural contours of the body
- Maintain the product's intended silhouette and style`;
  }
}
