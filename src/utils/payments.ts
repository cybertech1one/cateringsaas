declare global {
  interface Window {
    createLemonSqueezy: () => void;
    LemonSqueezy: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

export const openLemonSqueezy = (url: string) => {
  window.createLemonSqueezy();
  if (url) {
    window.LemonSqueezy.Url.Open(url);
  }
};
