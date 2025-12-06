/**
 * Vest Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateVestPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getVestGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and dress them in the VEST from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this vest

GARMENT TYPE: VEST/GILET (Sleeveless Outerwear)
${genderFit}
- The vest should be worn OVER whatever top/shirt the person is currently wearing
- Keep the person's current shirt/top visible underneath the vest
- The vest is sleeveless - the person's arms and sleeves of their underlying shirt should be fully visible
- The vest should fit naturally on the torso, following the body's contours
- Show the vest's collar, zipper/buttons, and pockets accurately
- The armholes should look natural with the underlying garment visible

CRITICAL LAYERING INSTRUCTIONS:
- DO NOT remove the person's existing shirt or top
- The vest goes ON TOP of their current clothing as an additional layer
- If the person is wearing a long-sleeve shirt, those sleeves should be visible coming out of the vest's armholes
- The neckline of the underlying shirt should be visible at the vest's collar

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. ADD the vest as a layer over their existing top - keep their current shirt/top visible underneath
3. The person's face, hair, skin tone, expression must be EXACTLY preserved
4. The person's pants/bottom wear must remain COMPLETELY UNCHANGED
5. The background from Image 1 must be kept EXACTLY as is
6. The lighting on the vest must match Image 1's lighting
7. The vest must look naturally worn with realistic draping

DO NOT:
- Generate a new person or model
- Show just the vest alone
- Remove or replace the person's underlying shirt/top
- Change the person's face, body, or pose
- Change the person's pants or bottom wear
- Change or remove the background

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} vest from Image 2 OVER their existing top, with everything else unchanged. This should look like a real photograph.`;
}

function getVestGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- The vest should have a broader fit across the shoulders
- Chest area should be relatively flat with straight lines
- The vest should taper slightly at the waist for a masculine silhouette
- Armholes should be cut to accommodate broader shoulders
- If it's a puffer/quilted vest, maintain the boxy masculine structure
- For suit vests/waistcoats, ensure a fitted, tailored look at the torso`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- The vest should contour to the body's curves naturally
- Account for bust - the vest should drape over the chest without pulling
- The waist may be more defined/tapered for feminine silhouette
- Armholes may be cut smaller and higher for women's proportions
- If it's a puffer vest, it can have a more cropped or fitted style
- Preserve any visible jewelry (necklaces, earrings) at the neckline`;
    default:
      return `
FIT CONSIDERATIONS:
- The vest should fit naturally to the person's body shape
- Follow the natural contours of the torso
- Armholes should align with the person's natural shoulder line`;
  }
}
