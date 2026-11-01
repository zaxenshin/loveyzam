import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, update } from "firebase/database";
import type { Unsubscribe } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCBVeRhiHwrmuFPNYLKccY7BTHmppo380M",
  authDomain: "yzamos.firebaseapp.com",
  databaseURL: "https://yzamos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "yzamos",
  storageBucket: "yzamos.firebasestorage.app",
  messagingSenderId: "58587438869",
  appId: "1:58587438869:web:f1fa6cbd3c1911eaf1e83c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// 💌 Save single letter directly to cloud without wiping others
export async function saveLetterToCloud(letter: any): Promise<void> {
  try {
    const nodeRef = ref(db, `letters/${letter.id}`);
    await set(nodeRef, letter);
  } catch (err) {
    console.warn("[Firebase] Save letter failed:", err);
  }
}

// 🗑️ Delete single letter from cloud
export async function deleteLetterFromCloud(letterId: string): Promise<void> {
  try {
    const nodeRef = ref(db, `letters/${letterId}`);
    await remove(nodeRef);
  } catch (err) {
    console.warn("[Firebase] Delete letter failed:", err);
  }
}

export function syncWithCloud<T>(
  nodePath: string,
  localItems: T,
  onCloudUpdate: (cloudData: T) => void
): Unsubscribe {
  const nodeRef = ref(db, nodePath);

  const unsubscribe = onValue(nodeRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        onCloudUpdate(val as T);
      }
    } else {
      if (Array.isArray(localItems) && localItems.length > 0) {
        const initialMap: Record<string, any> = {};
        localItems.forEach((item: any) => {
          if (item && item.id) initialMap[item.id] = item;
        });
        update(ref(db, nodePath), initialMap).catch((err) =>
          console.warn(`[Firebase] Initial seed failed:`, err)
        );
      }
    }
  });

  return unsubscribe;
}

export async function saveToCloud<T>(nodePath: string, data: T): Promise<void> {
  try {
    const nodeRef = ref(db, nodePath);
    await set(nodeRef, data);
  } catch (err) {
    console.warn(`[Firebase] Save failed for ${nodePath}:`, err);
  }
}