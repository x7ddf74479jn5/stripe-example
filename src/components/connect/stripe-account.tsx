import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useState } from 'react';
import { db, fns } from 'src/lib/firebase';

type StripeAccount = {
  stripeAccountId: string;
  valid: boolean;
};

type Props = {
  user: User;
};

const StripeAccount = ({ user }: Props) => {
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);

  useEffect(() => {
    getStripeAccount().then((account) => setStripeAccount(account));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStripeAccount = async () => {
    const ref = doc(db, `stripeAccounts/${user.uid}`);
    const snap = await getDoc(ref);
    return snap.data() as StripeAccount;
  };

  const createStripeAccount = async () => {
    const callable = httpsCallable(fns, 'createStripeAccount');
    try {
      await callable();
      setStripeAccount(await getStripeAccount());
    } catch (error) {
      alert('販売アカウントの作成に失敗しました');
    }
  };

  const redirectStripeAccountForm = async () => {
    const callable = httpsCallable(fns, 'getStripeAccountFormLink');
    const { data } = await callable(stripeAccount?.stripeAccountId);
    window.location.assign(data as string);
  };

  const redirectToDashboard = async () => {
    const callable = httpsCallable(fns, 'getDashboardLink');
    const { data } = await callable();
    location.assign(data as string);
  };

  return (
    <div>
      {!stripeAccount && (
        <div>
          <button onClick={createStripeAccount}>販売をはじめる</button>
        </div>
      )}
      {stripeAccount && <p>ConnectアカウントID: {stripeAccount.stripeAccountId}</p>}
      {stripeAccount && !stripeAccount.valid ? (
        <button onClick={redirectStripeAccountForm}>販売者情報を登録してください</button>
      ) : (
        <p>確認情報の登録が完了しています✅</p>
      )}
      {stripeAccount?.valid && (
        <div>
          <button onClick={redirectToDashboard}>ダッシュボードを開く</button>
        </div>
      )}
    </div>
  );
};

export default StripeAccount;
