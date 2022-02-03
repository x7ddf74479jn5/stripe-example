import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ProductList from 'src/components/billing/product-list';
import { auth } from 'src/lib/firebase';
import styles from 'src/styles/Home.module.css';

const Home: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>();

  useEffect(() => {
    // ログインユーザーの監視とセット
    onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      getCustomClaimRole();
    });
  }, []);

  const getCustomClaimRole = async () => {
    await auth.currentUser?.getIdToken(true);
    const decodedToken = await auth.currentUser?.getIdTokenResult();
    setRole(decodedToken?.claims.stripeRole as string);
  };

  // ログイン
  const login = () => {
    signInWithPopup(auth, new GoogleAuthProvider());
  };

  // ログアウト
  const logout = () => {
    signOut(auth);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name='description' content='Generated by create next app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        {user ? <button onClick={logout}>ログアウト</button> : <button onClick={login}>ログイン</button>}
        <p>{role === 'premium' ? 'プレミアムプラン' : 'フリープラン'}</p>
        {user && <p>{user.displayName}さんようこそ</p>}
        {user && <ProductList user={user}></ProductList>}
      </main>
    </div>
  );
};

export default Home;