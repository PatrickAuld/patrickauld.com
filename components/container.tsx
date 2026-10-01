import { ReactNode } from "react";

export default function Container({ children }: { children: ReactNode }) {
  return <div className="container mx-auto px-3 py-12 relative sm:px-5">{children}</div>
}
