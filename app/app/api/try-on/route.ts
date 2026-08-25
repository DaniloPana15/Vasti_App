import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NANO_BANANA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key no configurada. Agregá NANO_BANANA_API_KEY en Vercel → Settings → Environment Variables." },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const res = await fetch("https://api.nano-banana.com/v1/try-on", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Error de la IA: ${res.status} — ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
