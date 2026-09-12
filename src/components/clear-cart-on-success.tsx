"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Empties the cart once the customer lands on the success page after paying. */
export function ClearCartOnSuccess() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
