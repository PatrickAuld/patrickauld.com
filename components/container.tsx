import { ReactNode } from "react";

export default function Container({ children }: { children: ReactNode }) {
  return <div className="container mx-auto px-5 py-12 relative">{children}</div>
}
