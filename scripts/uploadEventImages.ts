/**
 * Upload Event Images to Firebase Storage
 * Run with: npx tsx scripts/uploadEventImages.ts
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const IMAGE_FILES = {
  "CIPHER Pop-Up NYC": "public/images/events/event_popup_nyc_1765007440899.png",
  "Streetwear Meetup LA": "public/images/events/event_meetup_la_1765007456974.png", 
  "VIP Gold Member Launch": "public/images/events/event_vip_launch_1765007471883.png",
};

async function uploadEventImages() {
  console.log("📤 Uploading event images to Firebase Storage...\n");
  
  const eventsRef = db.collection("events");
  const snapshot = await eventsRef.get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const localPath = IMAGE_FILES[data.title];
    
    if (localPath && fs.existsSync(localPath)) {
      const fileName = path.basename(localPath);
      const destination = `events/${fileName}`;
      
      console.log(`  Uploading: ${data.title}...`);
      
      await bucket.upload(localPath, {
        destination,
        metadata: {
          contentType: "image/png",
          cacheControl: "public, max-age=31536000",
        }
      });
      
      // Make the file publicly accessible
      const file = bucket.file(destination);
      await file.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
      
      // Update Firestore with the new URL
      await doc.ref.update({ imageUrl: publicUrl });
      
      console.log(`  ✓ ${data.title}: ${publicUrl}`);
    } else {
      console.log(`  ⚠ Skipping: ${data.title} (no local file)`);
    }
  }
  
  console.log("\n✅ Event images uploaded to Firebase Storage!");
  process.exit(0);
}

uploadEventImages().catch(console.error);
