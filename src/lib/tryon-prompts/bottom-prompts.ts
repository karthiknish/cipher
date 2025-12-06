/**
 * Bottom Wear Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateBottomPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getBottomGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and dress them in the BOTTOM WEAR from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this bottom wear item

GARMENT TYPE: BOTTOM WEAR (Pants/Shorts/Skirt)
${genderFit}
- Replace ONLY the person's lower body clothing (from waist down)
- Keep the person's upper body and any top/shirt they are wearing COMPLETELY UNCHANGED
- The pants/bottoms should start at the natural waistline
- Preserve the person's legs, feet, and shoes if visible
- Make sure the bottom garment flows naturally with the person's leg position and stance
- Show accurate details like pockets, seams, and fit

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only the lower body clothing should change - everything else stays IDENTICAL to Image 1
3. The person's face, hair, skin tone, upper body clothing must be EXACTLY preserved
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the new clothing must match Image 1's lighting
6. The clothing must fit naturally on the person's body with realistic draping

DO NOT:
- Generate a new person or model
- Show just the clothing item alone
- Change the person's face, body, or pose
- Change or remove the person's top/shirt
- Change or remove the background
- Add or remove any other elements

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged.`;
}

function getBottomGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Waistband sits at the natural waist or slightly below (based on style)
- Pants should have a straighter cut through the hips
- For jeans/casual pants: relaxed or straight-leg fit is typical
- For dress pants: clean, tailored lines with a slight taper
- Cargo pants should show masculine pocket placement
- Shorts typically fall above or at the knee
- The crotch area should fit naturally without pulling
- Leg openings match the product's style (slim, straight, wide)`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- Waistband can be high-waisted, mid-rise, or low-rise based on product
- The hips and thighs should have appropriate room for feminine curves
- For jeans: can be skinny, straight, wide-leg, or flared
- For dress pants: tailored to follow feminine leg shape
- Skirts should fall naturally from the waist/hips
- Shorts can be various lengths - maintain product's intended style
- The waist may have more defined shaping
- Leg openings and hem should match the product's design`;
    default:
      return `
FIT CONSIDERATIONS:
- The bottoms should fit naturally to the person's body shape
- Waistband should sit at the appropriate height for the style
- Follow the natural contours of the hips and legs`;
  }
}
