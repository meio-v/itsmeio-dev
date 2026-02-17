"use client";

import { getTagCategory } from "@/lib/tags";

export function Tag({ children }: { children: string }) {
  const category = getTagCategory(children);
  return (
    <span className="tag" data-cat={category}>
      {children}
    </span>
  );
}
