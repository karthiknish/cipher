/**
 * Virtual Try-On Types
 */

export type GarmentType = 
  | "cap" 
  | "vest" 
  | "top" 
  | "bottom" 
  | "fullbody" 
  | "jacket" 
  | "accessory"
  | "generic";

export type Gender = "male" | "female" | "unisex";

export interface TryOnOptions {
  productName: string;
  productCategory: string;
  colorVariant?: string;
  gender?: Gender;
}
