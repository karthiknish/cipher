/**
 * Cap/Hat Prompts - Male & Female
 */

import { Gender } from "./types";

export function generateCapPrompt(productName: string, colorInfo: string, gender: Gender = "unisex"): string {
  const genderFit = getCapGenderFit(gender);
  
  return `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 and place the CAP/HAT from IMAGE 2 on their head.

IMAGE 1: A photo of a person - YOU MUST USE THIS EXACT PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this cap/hat

GARMENT TYPE: HEADWEAR (Cap/Hat/Beanie)
${genderFit}
- Place the cap/hat naturally on the person's head
- Position it at the correct angle matching typical wear style
- The cap should sit properly on the forehead and wrap around the head naturally
- Adjust for the person's hair - show hair appropriately around/under the cap
- If it's a snapback or adjustable cap, show the back strap naturally
- For beanies, ensure it covers the appropriate amount of the head

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only ADD the cap/hat to their head - do NOT change anything else
3. The person's face, hair (visible portions), skin tone, expression must be EXACTLY preserved
4. The person's clothing and entire body must remain COMPLETELY UNCHANGED
5. The background from Image 1 must be kept EXACTLY as is
6. The lighting on the cap must match Image 1's lighting
7. The cap must look naturally worn, not floating or pasted on

DO NOT:
- Generate a new person or model
- Show just the cap alone
- Change the person's face, hairstyle (except where covered by cap), or expression
- Change or modify the person's clothing
- Change or remove the background
- Add or remove any other elements

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} cap/hat from Image 2 on their head, with everything else unchanged. This should look like a real photograph.`;
}

function getCapGenderFit(gender: Gender): string {
  switch (gender) {
    case "male":
      return `
MALE FIT CONSIDERATIONS:
- Position the cap with a slightly forward or straight-on angle typical of men's styling
- Account for typically shorter hairstyles - show natural hairline around ears and back
- The cap should have a structured, clean look
- For baseball caps, the brim can be straight or slightly curved`;
    case "female":
      return `
FEMALE FIT CONSIDERATIONS:
- Position the cap stylishly - can be worn straight, slightly tilted, or with a ponytail through the back
- Account for longer hair - show hair flowing naturally around or through the cap
- For ponytail wearers, hair should come through the back opening if the cap has one
- The cap can sit slightly higher on the head for a feminine look
- Preserve any visible earrings or accessories`;
    default:
      return `
FIT CONSIDERATIONS:
- Position the cap naturally based on the person's existing style
- Account for the person's hairstyle - show hair appropriately around the cap
- The cap should look naturally worn and comfortable`;
  }
}
