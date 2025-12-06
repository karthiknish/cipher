/**
 * Generic/Fallback Prompts
 */

import { Gender } from "./types";

export function generateGenericPrompt(
  productName: string, 
  productCategory: string, 
  colorInfo: string,
  gender: Gender = "unisex"
): string {
  const genderFit = getGenericGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 (their full body, face, pose, background) and dress them in the CLOTHING ITEM from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this clothing item

PRODUCT DETAILS:
- Item: ${productName}
- Category: ${productCategory || "Apparel"}

${genderFit}

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Apply the clothing item naturally to the appropriate body area
3. The person's face, hair, skin tone, body proportions must be EXACTLY preserved
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the new clothing must match Image 1's lighting
6. The clothing must fit naturally on the person's body with realistic draping

DO NOT:
- Generate a new person or model
- Show just the clothing item alone
- Change the person's face, body, or pose
- Change or remove the background
- Add or remove any other elements

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged. This should look like a real photograph, not a composite.`;
}

function getGenericGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Clothing should have masculine proportions and fit
- Shoulders should be broad and structured
- Torso should be straight or slightly tapered
- Overall silhouette should be angular and defined`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- Clothing should contour to feminine body shape
- Account for curves in the bust, waist, and hips
- Silhouette may be fitted, flowy, or structured based on the garment
- Preserve any visible jewelry or accessories`;
    default:
      return `
FIT CONSIDERATIONS:
- The clothing should fit naturally to the person's body shape
- Follow the natural contours of the body
- Maintain the product's intended fit and style`;
  }
}
