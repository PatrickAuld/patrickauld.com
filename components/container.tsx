import { Props } from "react";

export default function Container({ children }: any) {
  return <div className="container mx-auto px-5 py-12 relative">{children}</div>
}
