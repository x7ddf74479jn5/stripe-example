/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const fns = functions.region("asia-northeast1");

const stripe = new Stripe(functions.config().stripe.key, {
  apiVersion: "2020-08-27",
});

export const createCustomer = fns.auth.user().onCreate(async (user) => {
  const customer = await stripe.customers.create({
    name: user.displayName,
    email: user.email,
    metadata: {
      firebaseUID: user.uid,
    },
  });

  return db.doc(`customers/${user.uid}`).set({
    stripeId: customer.id,
  });
});

export const getStripeAccountFormLink = fns.https.onCall(async (account) => {
  const accountLink = await stripe.accountLinks.create({
    account,
    refresh_url: "http://localhost:3000",
    return_url: "http://localhost:3000",
    type: "account_onboarding",
  });

  return accountLink.url;
});

const endpointSecret = functions.config().stripe.webhook.secret;

export const handleStripeWebhook = fns.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const accountSnap = await db.collection("stripeAccounts").where("stripeAccountId", "==", account.id).get();

      if (!accountSnap.empty) {
        const accountRef = accountSnap.docs[0].ref;
        accountRef.update({
          valid: account.charges_enabled,
        });
      }
      break;
    }
  }

  res.status(200).send("success");
});

export const createStripeAccount = fns.https.onCall(async (_, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const user = await auth.getUser(context.auth.uid);

  const account = await stripe.accounts.create({
    type: "express",
    country: "JP",
    email: user.email,
    business_type: "individual",
    company: {
      name: user.displayName,
    },
    business_profile: {
      url: "https://flock-team.github.io/stripe-doc",
    },
  });

  return db.doc(`stripeAccounts/${user.uid}`).set({
    stripeAccountId: account.id,
  });
});

export const createCheckoutSession = fns.https.onCall(async (_, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const customerSnap = await db.doc(`customers/${context.auth.uid}`).get();
  const customer = customerSnap.data()?.stripeId as string;

  const accountSnap = await db.doc(`stripeAccounts/${context.auth.uid}`).get();
  const account = accountSnap.data()?.stripeAccountId as string;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [
      {
        price: "price_1KLKQPHKPHgsaXXhIwTCqN8N",
        tax_rates: ["txr_1KLKRBHKPHgsaXXh3RsYP1bW"],
        quantity: 1,
      },
    ],
    cancel_url: "http://localhost:3000",
    success_url: "http://localhost:3000",
    payment_intent_data: {
      setup_future_usage: "off_session",
      application_fee_amount: 300,
      transfer_data: {
        destination: account,
      },
    },
  });

  return session.url;
});

export const getDashboardLink = fns.https.onCall(async (_, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ログインが必要です");
  }

  const accountSnap = await db.doc(`stripeAccounts/${context.auth.uid}`).get();
  const account = accountSnap.data()?.stripeAccountId as string;

  const link = await stripe.accounts.createLoginLink(account);
  return link.url;
});
