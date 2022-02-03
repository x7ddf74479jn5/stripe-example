import { User } from 'firebase/auth';
import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from 'src/lib/firebase';

type Interval = 'month' | 'year' | 'week' | 'day';

type Price = {
  id: string;
  description: string;
  unit_amount: number;
  active: boolean;
  type: 'recurring' | 'one_time';
  recurring: {
    interval: Interval;
    interval_count: number;
  };
};

type Product = {
  id: string;
  active: boolean;
  name: string;
  prices: Price[];
};

type Props = {
  user: User;
};

const ProductList = ({ user }: Props) => {
  const [products, setProducts] = useState<Product[]>();

  useEffect(() => {
    const ref = collection(db, 'products');
    const q = query(ref, where('active', '==', true));
    getDocs(q).then(async (snap) => {
      const promises = snap.docs.map(async (doc) => {
        const product = {
          ...(doc.data() as Product),
          id: doc.id,
        };
        const priceRef = collection(db, doc.ref.path, 'prices');
        const priceSnap = await getDocs(priceRef);
        product.prices = priceSnap.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          } as Price;
        });

        return product as Product;
      });

      setProducts(await Promise.all(promises));
    });
  }, []);

  const getIntervalLabel = (interval: Interval) => {
    return {
      day: '日',
      month: 'か月',
      year: '年',
      week: '週間',
    }[interval];
  };

  const redirectToCheckout = async (priceId: string) => {
    const collectionRef = collection(db, `customers/${user.uid}/checkout_sessions`);
    const docRef = await addDoc(collectionRef, {
      billing_address_collection: 'auto',
      success_url: window.location.origin,
      cancel_url: window.location.origin,
      line_items: [
        {
          price: priceId,
          tax_rates: ['txr_1KOfa8IXEbEbwpid4xWv68k5'],
          quantity: 1,
        },
      ],
    });

    onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        url: string;
        error: Error;
      };

      if (error) {
        alert(`An error occured: ${error.message}`);
      }

      if (url) {
        window.location.assign(url);
      }
    });
  };

  return (
    <div>
      {products
        ?.filter((product) => product.active)
        .map((product) => (
          <div key={product.id}>
            <h2>{product.name}</h2>
            {product.prices
              .filter((price) => price.active && price.type === 'recurring')
              .map((price) => (
                <div key={price.id}>
                  {price.recurring.interval_count}
                  {getIntervalLabel(price.recurring.interval)}ごとに
                  {price.unit_amount.toLocaleString()}円
                  <button onClick={() => redirectToCheckout(price.id)}>開始</button>
                </div>
              ))}
          </div>
        ))}
    </div>
  );
};

export default ProductList;
