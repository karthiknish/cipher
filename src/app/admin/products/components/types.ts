import { Product, ColorVariant, SizeStock } from "@/context/ProductContext";

export type ProductTab = "basic" | "media" | "variants" | "inventory" | "details";

export const CATEGORIES = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export const SUGGESTED_TAGS = [
  "bestseller",
  "new-arrival",
  "limited-edition",
  "sustainable",
  "premium",
  "essential",
  "oversized",
  "slim-fit",
  "unisex",
];

export interface ProductFormData extends Omit<Product, "id"> {}

export interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export interface ColorFormState {
  newColor: ColorVariant;
  setNewColor: React.Dispatch<React.SetStateAction<ColorVariant>>;
}

export interface TagFormState {
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
}

export const getInitialFormData = (): ProductFormData => ({
  name: "",
  price: 0,
  comparePrice: 0,
  category: "Tees",
  description: "",
  shortDescription: "",
  image: "",
  images: [],
  sizes: ["S", "M", "L", "XL"],
  sizeStock: [
    { size: "S", stock: 10 },
    { size: "M", stock: 10 },
    { size: "L", stock: 10 },
    { size: "XL", stock: 10 },
  ],
  colors: [],
  inStock: true,
  sku: "",
  weight: 0,
  material: "",
  careInstructions: "",
  tags: [],
  featured: false,
  isNew: false,
});

export const getInitialColor = (): ColorVariant => ({
  name: "",
  hex: "#000000",
  image: "",
  inStock: true,
});
