"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    setKey(pathname);
  }, [pathname]);

  // Don't transition immersive session
  if (pathname.startsWith("/sesion") || pathname.startsWith("/focus")) {
    return <>{children}</>;
  }

  return (
    <div key={key} className="page-transition">
      {children}
    </div>
  );
}
