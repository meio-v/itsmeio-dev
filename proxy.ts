import { type NextRequest, NextResponse } from "next/server";

import { isMallEnabled } from "@/lib/mall-feature";
import { isRideLabEnabled } from "@/lib/ride-lab-feature";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/mall/ride-lab") {
    return isRideLabEnabled()
      ? NextResponse.next()
      : new NextResponse("Not Found", { status: 404 });
  }
  if (!isMallEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mall", "/mall/ride-lab"],
};
