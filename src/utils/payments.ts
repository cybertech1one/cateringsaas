declare global {
  interface Window {
    // Legacy payment overlay — kept for backward compatibility
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

/**
 * Open the payment provider checkout overlay.
 * Internally still uses the LemonSqueezy JS SDK; this wrapper
 * decouples the rest of the app from that specific vendor.
 */
export const openPaymentCheckout = (url: string) => {
  window.createLemonSqueezy();
  if (url) {
    window.LemonSqueezy.Url.Open(url);
  }
};

/** @deprecated Use openPaymentCheckout instead */
export const openLemonSqueezy = openPaymentCheckout;
