import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

/** Loaded only on checkout — keeps Stripe.js off admin / storefront boot path. */
const stripePromise = loadStripe(
  "pk_test_51SZR8tBr6feLHBsTihpvakcYTtUKzYmD86ImCvthYHPAdpzT8KHGOmt4Edqs09Ai9uKyPhVElHC87Yoah3esy3Ot00xQrnQCWL"
);

export default function StripeElementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
