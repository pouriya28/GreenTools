import type { ReactNode } from "react";
import { NotificationContainer } from "./NotificationContainer";

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NotificationContainer />
    </>
  );
}