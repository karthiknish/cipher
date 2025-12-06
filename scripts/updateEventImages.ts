/**
 * Update Event Images in Firebase
 * Run with: npx tsx scripts/updateEventImages.ts
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const IMAGE_UPDATES = {
  "CIPHER Pop-Up NYC": "/images/events/event_popup_nyc_1765007440899.png",
  "Streetwear Meetup LA": "/images/events/event_meetup_la_1765007456974.png",
  "VIP Gold Member Launch": "/images/events/event_vip_launch_1765007471883.png",
};

async function updateEventImages() {
  console.log("🖼️  Updating event images...\n");
  
  const eventsRef = db.collection("events");
  const snapshot = await eventsRef.get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const newImageUrl = IMAGE_UPDATES[data.title];
    
    if (newImageUrl) {
      await doc.ref.update({ imageUrl: newImageUrl });
      console.log(`  ✓ Updated: ${data.title}`);
    }
  }
  
  console.log("\n✅ Event images updated!");
  process.exit(0);
}

updateEventImages();
