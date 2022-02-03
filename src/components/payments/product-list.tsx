import { User } from 'firebase/auth';
import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from 'src/lib/firebase';

type Price = {
  id: string;
  description: string;
  unit_amount: number;
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

  const redirectToCheckout = async (priceId: string) => {
    const collectionRef = collection(db, `customers/${user.uid}/checkout_sessions`);
    const docRef = await addDoc(collectionRef, {
      mode: 'payment',
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

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          {product.prices.map((price) => (
            <div key={price.id}>
              {price.description || '通常'} - {price.unit_amount.toLocaleString()}円
              <button onClick={() => redirectToCheckout(price.id)}>購入</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ProductList;
