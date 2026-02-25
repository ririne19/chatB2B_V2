"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isConversations = pathname?.startsWith("/conversations");
  if (isConversations) return null;
  return <Navbar />;
}
