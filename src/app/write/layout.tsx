import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { isAuthenticated } from "@/shared/lib/auth";

interface WriteLayoutProps {
  children: ReactNode;
}

export default async function WriteLayout({
  children,
}: WriteLayoutProps): Promise<ReactNode> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return children;
}
