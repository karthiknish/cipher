import { storage, auth } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * Upload an image to Firebase Storage
 * @param file - The file to upload
 * @param path - The path in storage (e.g., "products/image.jpg")
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // Debug: Log auth state
    const currentUser = auth.currentUser;
    console.log("Upload auth state:", {
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
    });
    
    if (!currentUser) {
      throw new Error("User not authenticated. Please sign in and try again.");
    }
    
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the file with explicit content type
    const metadata = {
      contentType: file.type || 'image/jpeg',
    };
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Upload a base64 image to Firebase Storage
 * @param base64Data - The base64 encoded image data
 * @param path - The path in storage (e.g., "products/image.jpg")
 * @returns The download URL of the uploaded image
 */
export async function uploadBase64Image(base64Data: string, path: string): Promise<string> {
  try {
    // Extract the content type and data from base64 string
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image data");
    }
    
    const contentType = matches[1];
    const base64 = matches[2];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, { contentType });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param url - The download URL or path of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // If it's a full URL, extract the path
    let path = url;
    if (url.includes("firebasestorage.googleapis.com")) {
      const match = url.match(/\/o\/(.+?)\?/);
      if (match) {
        path = decodeURIComponent(match[1]);
      }
    }
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw - image may not exist or may be from external source
  }
}

/**
 * Check if a string is a base64 encoded image
 */
export function isBase64Image(str: string): boolean {
  return str?.startsWith("data:image");
}

/**
 * Generate a unique filename for upload
 */
export function generateImagePath(folder: string, originalName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName?.split(".").pop() || "jpg";
  return `${folder}/${timestamp}-${random}.${extension}`;
}
