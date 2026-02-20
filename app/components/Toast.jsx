// app/components/Toast.jsx
import { Frame, Toast } from "@shopify/polaris";

export default function ToastFrame({ toast, onDismiss, children }) {
  return (
    <Frame>
      {toast ? (
        <Toast content={toast} onDismiss={onDismiss} />
      ) : null}
      {children}
    </Frame>
  );
}
