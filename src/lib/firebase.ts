import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC-3CbTrmnoE6ban79_5ICd43OTe9R9Q4A',
  authDomain: 'stripe-example-11514.firebaseapp.com',
  projectId: 'stripe-example-11514',
  storageBucket: 'stripe-example-11514.appspot.com',
  messagingSenderId: '956092398781',
  appId: '1:956092398781:web:adc9e0cae9df935c790bd4',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const fns = getFunctions(app, 'asia-northeast1');
export const auth = getAuth(app);
