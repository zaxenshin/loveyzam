import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
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

export function syncWithCloud<T>(
  nodePath: string,
  localItems: T,
  onCloudUpdate: (cloudData: T) => void
): Unsubscribe {
  const nodeRef = ref(db, nodePath);
  let isFirstCheck = true;

  const unsubscribe = onValue(nodeRef, (snapshot) => {
    if (isFirstCheck) {
      isFirstCheck = false;
      if (!snapshot.exists()) {
        if (localItems !== undefined && localItems !== null) {
          set(nodeRef, localItems).catch((err) =>
            console.warn(`[Firebase] Initial upload failed for ${nodePath}:`, err)
          );
        }
        return;
      }
    }

    if (snapshot.exists()) {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        onCloudUpdate(val as T);
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