import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

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

// Helper function para mag-sync ng data
export const syncWithCloud = <T>(
  nodePath: string,
  localItems: T[],
  onCloudUpdate: (items: T[]) => void
) => {
  const dbRef = ref(db, nodePath);
  let hasPushedInitial = false;

  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      onCloudUpdate(Array.isArray(data) ? data : Object.values(data));
    } else if (!hasPushedInitial && localItems && localItems.length > 0) {
      hasPushedInitial = true;
      set(dbRef, localItems);
    }
  });

  return unsubscribe;
};

export const saveToCloud = <T>(nodePath: string, data: T[]) => {
  const dbRef = ref(db, nodePath);
  set(dbRef, data);
};