// Global app wrapper: global CSS + toast provider tüm sayfalara buradan dağılır.

import type { AppProps } from "next/app";
import { ToastProvider } from "../components/Toast";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
