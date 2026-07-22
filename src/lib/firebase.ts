import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = initializeApp(firebaseConfig);

// Connect to the specific database instance specified in config
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

export async function ensureAnonymousAuth(): Promise<{ uid: string }> {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (err) {
    console.warn('Anonymous auth unavailable or restricted, using fallback client ID:', err);
    let localUid = localStorage.getItem('meetsync_fallback_uid');
    if (!localUid) {
      localUid = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('meetsync_fallback_uid', localUid);
    }
    return { uid: localUid };
  }
}
