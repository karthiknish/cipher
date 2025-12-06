/**
 * Accessory Prompts
 */

import { Gender } from "./types";

export function generateAccessoryPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getAccessoryGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and ADD the ACCESSORY from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this accessory

GARMENT TYPE: ACCESSORY
${genderFit}
- ADD this accessory to the person without changing their outfit
- Place the accessory in the appropriate location (wrist for watches/bracelets, neck for necklaces, etc.)
- The accessory should look naturally worn
- Keep all of the person's current clothing completely unchanged

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only ADD the accessory - do NOT change any clothing
3. Everything about the person must be EXACTLY preserved except for the added accessory
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the accessory must match Image 1's lighting

DO NOT:
- Generate a new person or model
- Show just the accessory alone
- Change the person's face, body, pose, or clothing
- Change or remove the background

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} accessory from Image 2, with everything else unchanged.`;
}

function getAccessoryGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE ACCESSORY CONSIDERATIONS:
- Watches: typically larger face, fits on the left wrist
- Bracelets: often leather, metal, or beaded with masculine designs
- Necklaces/Chains: typically shorter, simpler designs
- Sunglasses: angular or aviator styles are common
- Bags: messenger bags, backpacks, or briefcases
- Size proportions should match masculine wrist/body size`;
    case "female":
      return `
FEMALE ACCESSORY CONSIDERATIONS:
- Watches: can be dainty or statement pieces
- Bracelets: can be delicate chains, bangles, or cuffs
- Necklaces: various lengths from choker to long pendant
- Earrings: preserve and complement any existing earrings
- Sunglasses: various styles from cat-eye to oversized
- Bags: handbags, clutches, or crossbody bags
- Size proportions should match feminine wrist/body size
- Consider layering with existing jewelry if visible`;
    default:
      return `
ACCESSORY CONSIDERATIONS:
- Place the accessory in its natural position on the body
- Size should be proportional to the person
- The accessory should complement the person's existing style`;
  }
}
