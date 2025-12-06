/**
 * Top Wear Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateTopPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getTopGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and dress them in the TOP from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this top

GARMENT TYPE: TOP WEAR (Shirt/T-Shirt/Sweater)
${genderFit}
- Replace ONLY the person's upper body clothing (torso area)
- Keep the person's lower body and any pants/bottoms they are wearing COMPLETELY UNCHANGED
- The top should fit naturally on shoulders, chest, and arms
- Preserve sleeves and collar as shown in the product image
- Show accurate details like neckline, sleeve length, and fit

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only the upper body clothing should change - everything else stays IDENTICAL to Image 1
3. The person's face, hair, skin tone, bottom wear must be EXACTLY preserved
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the new clothing must match Image 1's lighting
6. The clothing must fit naturally on the person's body with realistic draping

DO NOT:
- Generate a new person or model
- Show just the clothing item alone
- Change the person's face, body, or pose
- Change or remove the person's pants/bottoms
- Change or remove the background

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged.`;
}

function getTopGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Shoulders should be straight and broad with natural shoulder seams
- The chest area should be flat and straight
- The torso can be straight-cut or slightly tapered at the waist
- T-shirts and casual tops should have a relaxed, boxy fit
- Dress shirts should be more fitted through the torso
- Sleeves should fit comfortably around the arms without being too tight
- Collar sits at the base of the neck with appropriate structure`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- The top should contour naturally to the body's curves
- Account for bust - fabric should drape naturally over the chest
- Waist may be more defined for feminine silhouette
- Necklines can vary (crew, v-neck, scoop) - maintain the product's style
- Sleeves may be fitted or have feminine details (puff, cap sleeves)
- The hem can be cropped, fitted, or flowy based on the product
- Preserve any visible jewelry at the neckline or wrists`;
    default:
      return `
FIT CONSIDERATIONS:
- The top should fit naturally to the person's body shape
- Follow the natural contours of the shoulders and torso
- Maintain the product's intended fit and style`;
  }
}
