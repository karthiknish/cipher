/**
 * Script to set admin role for a user in Firebase Firestore
 * 
 * SETUP:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project (cipher-c9c8b)
 * 3. Go to Project Settings > Service Accounts
 * 4. Click "Generate New Private Key"
 * 5. Save the downloaded JSON file as: scripts/serviceAccountKey.json
 * 
 * USAGE:
 *   npm run set-admin
 * 
 * NOTE: The user must have signed up first before running this script.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Configuration - Update this email to set different admins
const ADMIN_EMAIL = 'karthik.nishanth06@gmail.com';

// Initialize Firebase Admin SDK
// For local development, you'll need to download a service account key from Firebase Console
// Go to: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
// Save as: scripts/serviceAccountKey.json

async function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Try to use service account key file
      const serviceAccount = require('./serviceAccountKey.json');
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized with service account');
    } catch {
      // Fallback to default credentials (for cloud environments)
      initializeApp();
      console.log('✅ Firebase Admin initialized with default credentials');
    }
  }
}

async function setUserRole(email: string, role: 'admin' | 'user') {
  try {
    await initializeFirebaseAdmin();
    
    const auth = getAuth();
    const db = getFirestore();
    
    // Get user by email
    console.log(`\n🔍 Looking up user: ${email}`);
    
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✅ Found user: ${user.uid}`);
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/user-not-found') {
        console.error(`❌ User not found with email: ${email}`);
        console.log('\n💡 The user needs to sign up first before setting their role.');
        process.exit(1);
      }
      throw error;
    }
    
    // Set custom claims for the user
    console.log(`\n📝 Setting custom claims for user...`);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`✅ Custom claims set: { role: "${role}" }`);
    
    // Also store role in Firestore for easier querying
    console.log(`\n📦 Updating Firestore user document...`);
    try {
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        await userRef.update({
          role,
          updatedAt: new Date(),
        });
        console.log(`✅ Updated existing user document`);
      } else {
        await userRef.set({
          email: user.email,
          displayName: user.displayName || '',
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Created new user document`);
      }
    } catch {
      console.log(`⚠️  Could not update Firestore (this is optional)`);
      console.log(`   The custom claims were set successfully - admin access will work.`);
    }
    
    console.log(`\n🎉 Successfully set ${email} as ${role}!`);
    console.log('\n📋 Summary:');
    console.log(`   User ID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${role}`);
    console.log('\n⚠️  Note: The user may need to sign out and sign back in for changes to take effect.');
    
  } catch (error) {
    console.error('\n❌ Error setting user role:', error);
    process.exit(1);
  }
}

// Run the script
setUserRole(ADMIN_EMAIL, 'admin')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
