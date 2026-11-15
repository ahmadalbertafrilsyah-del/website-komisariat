import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
      cache: "force-cache",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
