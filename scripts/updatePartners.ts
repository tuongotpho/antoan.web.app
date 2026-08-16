import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Cấu hình Firebase — phải khớp với services/firebaseConfig.ts.
// Trước đây file này trỏ sang project gen-lang-client-0113063590, tức script
// chạy xong sẽ sửa dữ liệu ở project KHÔNG phải project app đang dùng.
const firebaseConfig = {
  apiKey: 'AIzaSyCFRcMNj_vOOqOaJlGbLbGF6Z1HpawGyDg',
  authDomain: 'atld-connect.firebaseapp.com',
  projectId: 'atld-connect',
  storageBucket: 'atld-connect.firebasestorage.app',
  messagingSenderId: '745800129021',
  appId: '1:745800129021:web:8b37c115c4327930dc6194',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updatePartners() {
  try {
    console.log('Fetching all partners...');
    const partnersRef = collection(db, 'partners');
    const snapshot = await getDocs(partnersRef);

    console.log(`Found ${snapshot.size} partners`);

    let updated = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const updates: any = {};

      // Add missing fields with default values
      if (data.verified === undefined) {
        updates.verified = false;
      }

      if (data.featured === undefined) {
        updates.featured = false;
      }

      if (!data.businessName) {
        // Generate businessName from email
        const email = data.email || '';
        const emailPrefix = email.split('@')[0];
        const generatedName = emailPrefix
          .split(/[-_.]/)
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        updates.businessName = generatedName || 'Đối tác';
      }

      if (!data.description || data.description === 'description') {
        const capabilities = data.capabilities || [];
        if (capabilities.length > 0) {
          updates.description = `Đơn vị đào tạo chuyên về ${capabilities[0]} và các lĩnh vực an toàn lao động khác`;
        } else {
          updates.description = 'Đơn vị đào tạo an toàn lao động uy tín';
        }
      }

      if (!data.website) {
        updates.website = '';
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        console.log(`Updating partner ${docSnap.id}:`, updates);
        await updateDoc(doc(db, 'partners', docSnap.id), updates);
        updated++;
      }
    }

    console.log(`✅ Successfully updated ${updated} partners`);
  } catch (error) {
    console.error('Error updating partners:', error);
  }
}

// Run the update
updatePartners();
