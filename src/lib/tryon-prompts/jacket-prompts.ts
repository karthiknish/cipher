/**
 * Jacket/Outerwear Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateJacketPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getJacketGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and dress them in the JACKET from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this jacket/outerwear

GARMENT TYPE: JACKET/OUTERWEAR
${genderFit}
- The jacket should be worn as an outer layer
- Replace their current outerwear/jacket if wearing one, OR add over their top
- Show the jacket's collar, sleeves, zipper/buttons, and pockets accurately
- The jacket should fit naturally on shoulders, torso, and arms
- Ensure sleeves fall to the appropriate length

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only the outerwear/jacket area should change - keep pants/bottom wear unchanged
3. The person's face, hair, skin tone, expression must be EXACTLY preserved
4. The person's bottom wear must remain COMPLETELY UNCHANGED
5. The background from Image 1 must be kept EXACTLY as is
6. The lighting on the jacket must match Image 1's lighting

DO NOT:
- Generate a new person or model
- Show just the jacket alone
- Change the person's face, body, or pose
- Change the person's pants or bottom wear
- Change or remove the background

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged.`;
}

function getJacketGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Shoulders should be structured and broad with defined shoulder seams
- The chest and torso should have a straighter, more boxy silhouette
- Bomber jackets: relaxed fit with ribbed cuffs and hem
- Leather jackets: fitted through the torso with some structure
- Hoodies: relaxed, comfortable fit with appropriate hood size
- Blazers/Sport coats: tailored fit through the chest and waist
- Sleeves should be long enough to cover the wrist when arms are down
- Collar and lapels should have masculine proportions`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- Shoulders may be structured or relaxed based on style
- The jacket should contour to the body's curves
- Account for bust - the jacket should close properly over the chest
- Waist may be more defined or cinched for feminine silhouette
- Cropped jackets should hit at the natural waist or above
- Sleeves may be fitted or have feminine details
- Bomber jackets can have a more fitted or cropped style
- Preserve any visible jewelry or accessories
- Collar and neckline should complement feminine features`;
    default:
      return `
FIT CONSIDERATIONS:
- The jacket should fit naturally to the person's body shape
- Shoulders should align with the person's natural shoulder line
- Follow the natural contours of the torso`;
  }
}
