/**
 * Firebase Admin SDK for Server-Side Authentication
 * 
 * This module provides secure server-side token verification
 * using the Firebase Admin SDK. Unlike client-side verification,
 * this properly validates token signatures and claims.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";

// Singleton instance
let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let initializationError: string | null = null;

/**
 * Initialize Firebase Admin SDK
 * 
 * Supports two methods:
 * 1. Service account JSON file (GOOGLE_APPLICATION_CREDENTIALS env var)
 * 2. Individual environment variables (FIREBASE_ADMIN_*)
 */
function initializeFirebaseAdmin(): { app: App; auth: Auth } | null {
  // Return existing instance if already initialized
  if (adminApp && adminAuth) {
    return { app: adminApp, auth: adminAuth };
  }

  // Don't retry if initialization already failed
  if (initializationError) {
    return null;
  }

  try {
    // Check if already initialized by another module
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminAuth = getAuth(adminApp);
      return { app: adminApp, auth: adminAuth };
    }

    // Method 1: Service account JSON file path
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // Method 2: Individual environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (serviceAccountPath) {
      // Initialize with service account file
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else if (projectId && clientEmail && privateKey) {
      // Initialize with individual credentials
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      // No valid credentials found
      initializationError = "Firebase Admin credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_* env vars.";
      console.warn(`[Firebase Admin] ${initializationError}`);
      return null;
    }

    adminAuth = getAuth(adminApp);
    console.log("[Firebase Admin] Successfully initialized");
    return { app: adminApp, auth: adminAuth };

  } catch (error) {
    initializationError = error instanceof Error ? error.message : "Unknown initialization error";
    console.error("[Firebase Admin] Initialization failed:", initializationError);
    return null;
  }
}

/**
 * Verify a Firebase ID token server-side
 * 
 * This properly validates:
 * - Token signature (using Google's public keys)
 * - Token expiration
 * - Token issuer
 * - Token audience (project ID)
 * 
 * @param idToken - The ID token to verify
 * @param checkRevoked - Whether to check if the token has been revoked (slower but more secure)
 */
export async function verifyIdToken(
  idToken: string,
  checkRevoked = false
): Promise<{ valid: true; decodedToken: DecodedIdToken } | { valid: false; error: string }> {
  const admin = initializeFirebaseAdmin();
  
  if (!admin) {
    return {
      valid: false,
      error: initializationError || "Firebase Admin not initialized",
    };
  }

  try {
    const decodedToken = await admin.auth.verifyIdToken(idToken, checkRevoked);
    return { valid: true, decodedToken };
  } catch (error) {
    const errorCode = (error as { code?: string }).code;
    
    // Map Firebase error codes to user-friendly messages
    let errorMessage: string;
    switch (errorCode) {
      case "auth/id-token-expired":
        errorMessage = "Token has expired. Please sign in again.";
        break;
      case "auth/id-token-revoked":
        errorMessage = "Token has been revoked. Please sign in again.";
        break;
      case "auth/invalid-id-token":
        errorMessage = "Invalid token format.";
        break;
      case "auth/argument-error":
        errorMessage = "Malformed token.";
        break;
      default:
        errorMessage = "Token verification failed.";
    }

    return { valid: false, error: errorMessage };
  }
}

/**
 * Check if a user has admin privileges
 * 
 * Checks for custom claims:
 * - admin: true
 * - role: "admin"
 */
export async function isAdmin(idToken: string): Promise<boolean> {
  const result = await verifyIdToken(idToken);
  
  if (!result.valid) {
    return false;
  }

  const claims = result.decodedToken;
  return claims.admin === true || claims.role === "admin";
}

/**
 * Get user info from token
 */
export async function getUserFromToken(
  idToken: string
): Promise<{ uid: string; email?: string; emailVerified?: boolean; admin?: boolean } | null> {
  const result = await verifyIdToken(idToken);
  
  if (!result.valid) {
    return null;
  }

  return {
    uid: result.decodedToken.uid,
    email: result.decodedToken.email,
    emailVerified: result.decodedToken.email_verified,
    admin: result.decodedToken.admin === true || result.decodedToken.role === "admin",
  };
}

/**
 * Set admin claim for a user (for use in admin scripts)
 */
export async function setAdminClaim(uid: string, isAdmin: boolean): Promise<boolean> {
  const admin = initializeFirebaseAdmin();
  
  if (!admin) {
    console.error("[Firebase Admin] Cannot set admin claim - not initialized");
    return false;
  }

  try {
    await admin.auth.setCustomUserClaims(uid, { admin: isAdmin, role: isAdmin ? "admin" : "user" });
    console.log(`[Firebase Admin] Set admin=${isAdmin} for user ${uid}`);
    return true;
  } catch (error) {
    console.error("[Firebase Admin] Failed to set admin claim:", error);
    return false;
  }
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseAdminConfigured(): boolean {
  return initializeFirebaseAdmin() !== null;
}

// Export types
export type { DecodedIdToken };
