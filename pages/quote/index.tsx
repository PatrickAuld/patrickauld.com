import { useEffect } from "react";
import { useRouter } from "next/router";

export default function QuoteIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quotes");
  }, [router]);

  return null;
}
