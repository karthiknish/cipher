/**
 * Virtual Try-On Prompt Templates
 * 
 * Specialized prompts for different garment types and genders
 * to ensure accurate virtual try-on results from the AI model.
 */

// Re-export types
export * from "./types";

// Import prompt generators
import { generateCapPrompt } from "./cap-prompts";
import { generateVestPrompt } from "./vest-prompts";
import { generateTopPrompt } from "./top-prompts";
import { generateBottomPrompt } from "./bottom-prompts";
import { generateJacketPrompt } from "./jacket-prompts";
import { generateFullBodyPrompt } from "./fullbody-prompts";
import { generateAccessoryPrompt } from "./accessory-prompts";
import { generateGenericPrompt } from "./generic-prompts";

import { GarmentType, Gender, TryOnOptions } from "./types";

/**
 * Detect the garment type from product name and category
 */
export function detectGarmentType(productName: string, productCategory: string): GarmentType {
  const name = productName.toLowerCase();
  const category = productCategory.toLowerCase();

  // Caps and Hats
  if (
    name.includes("cap") || name.includes("hat") || name.includes("beanie") ||
    name.includes("snapback") || name.includes("bucket") || name.includes("visor") ||
    category.includes("cap") || category.includes("hat") || category.includes("headwear")
  ) {
    return "cap";
  }

  // Vests
  if (
    name.includes("vest") || name.includes("gilet") || name.includes("waistcoat") ||
    category.includes("vest")
  ) {
    return "vest";
  }

  // Jackets and Outerwear
  if (
    name.includes("jacket") || name.includes("coat") || name.includes("hoodie") ||
    name.includes("bomber") || name.includes("windbreaker") || name.includes("parka") ||
    category.includes("jacket") || category.includes("outerwear")
  ) {
    return "jacket";
  }

  // Bottom wear
  if (
    name.includes("pants") || name.includes("cargo") || name.includes("jeans") ||
    name.includes("trouser") || name.includes("shorts") || name.includes("skirt") ||
    name.includes("jogger") || name.includes("sweatpants") ||
    category.includes("pants") || category.includes("bottom") || category.includes("trouser")
  ) {
    return "bottom";
  }

  // Full body garments
  if (
    name.includes("dress") || name.includes("jumpsuit") || name.includes("romper") ||
    name.includes("overalls") || name.includes("coverall") ||
    category.includes("dress") || category.includes("jumpsuit")
  ) {
    return "fullbody";
  }

  // Accessories (non-clothing)
  if (
    name.includes("bag") || name.includes("watch") || name.includes("sunglasses") ||
    name.includes("necklace") || name.includes("bracelet") || name.includes("ring") ||
    name.includes("earring") || name.includes("belt") ||
    category.includes("accessory") || category.includes("accessories")
  ) {
    return "accessory";
  }

  // Default to top wear (shirts, t-shirts, sweaters, etc.)
  if (
    name.includes("shirt") || name.includes("tee") || name.includes("sweater") ||
    name.includes("sweatshirt") || name.includes("polo") || name.includes("blouse") ||
    name.includes("tank") || name.includes("crop") ||
    category.includes("top") || category.includes("shirt")
  ) {
    return "top";
  }

  return "generic";
}

/**
 * Detect gender from product name, category, or explicit setting
 */
export function detectGender(productName: string, productCategory: string): Gender {
  const name = productName.toLowerCase();
  const category = productCategory.toLowerCase();

  // Check for explicit gender indicators
  if (
    name.includes("men's") || name.includes("mens") || name.includes("male") ||
    name.includes("for men") || name.includes("for him") ||
    category.includes("men's") || category.includes("mens") || category.includes("male")
  ) {
    return "male";
  }

  if (
    name.includes("women's") || name.includes("womens") || name.includes("female") ||
    name.includes("for women") || name.includes("for her") || name.includes("ladies") ||
    category.includes("women's") || category.includes("womens") || category.includes("female") ||
    category.includes("ladies")
  ) {
    return "female";
  }

  // Check for gender-specific garments
  if (
    name.includes("dress") || name.includes("skirt") || name.includes("blouse") ||
    name.includes("bra") || name.includes("leggings")
  ) {
    return "female";
  }

  if (
    name.includes("tie") || name.includes("suit") || name.includes("blazer")
  ) {
    // These can be unisex, but traditionally male
    return "unisex";
  }

  return "unisex";
}

/**
 * Generate the appropriate try-on prompt based on garment type and gender
 */
export function generateTryOnPrompt(
  productName: string,
  productCategory: string,
  colorVariant?: string,
  gender?: Gender
): string {
  const garmentType = detectGarmentType(productName, productCategory);
  const detectedGender = gender || detectGender(productName, productCategory);
  const colorInfo = colorVariant ? ` in ${colorVariant} color` : "";

  switch (garmentType) {
    case "cap":
      return generateCapPrompt(productName, colorInfo, detectedGender);
    case "vest":
      return generateVestPrompt(productName, colorInfo, detectedGender);
    case "jacket":
      return generateJacketPrompt(productName, colorInfo, detectedGender);
    case "bottom":
      return generateBottomPrompt(productName, colorInfo, detectedGender);
    case "fullbody":
      return generateFullBodyPrompt(productName, colorInfo, detectedGender);
    case "accessory":
      return generateAccessoryPrompt(productName, colorInfo, detectedGender);
    case "top":
      return generateTopPrompt(productName, colorInfo, detectedGender);
    default:
      return generateGenericPrompt(productName, productCategory, colorInfo, detectedGender);
  }
}

/**
 * Generate prompt with full options object
 */
export function generateTryOnPromptWithOptions(options: TryOnOptions): string {
  return generateTryOnPrompt(
    options.productName,
    options.productCategory,
    options.colorVariant,
    options.gender
  );
}
