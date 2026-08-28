import { NextResponse } from "next/server";

import { isMallEnabled } from "@/lib/mall-feature";

export function proxy() {
  if (!isMallEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/mall",
};
