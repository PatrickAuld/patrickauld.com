import { ReactNode } from "react";

export default function Container({ children }: { children: ReactNode }) {
  return (
    <div className="container relative mx-auto px-5 py-8 sm:py-12">
      {children}
    </div>
  )
}
