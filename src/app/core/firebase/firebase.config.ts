import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAuVSGchklqprWjILhS4t2S1WLX5TOne-Q',
  authDomain: 'equily-54c61.firebaseapp.com',
  projectId: 'equily-54c61',
  storageBucket: 'equily-54c61.firebasestorage.app',
  messagingSenderId: '264249118433',
  appId: '1:264249118433:web:b01f375b6da28cf88631a0',
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
