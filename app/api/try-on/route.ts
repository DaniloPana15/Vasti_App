import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NANO_BANANA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key no configurada. Andá a Vercel → Settings → Environment Variables y agregá NANO_BANANA_API_KEY." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const userPhoto = formData.get("image") as File;
    const wigUrl = formData.get("wig_url") as string;
    const wigName = formData.get("wig_name") as string;

    if (!userPhoto) {
      return NextResponse.json({ error: "Falta la foto del usuario." }, { status: 400 });
    }
    if (!wigUrl) {
      return NextResponse.json({ error: "Falta la URL de la peluca." }, { status: 400 });
    }

    // Foto del usuario → base64
    const userBuffer = Buffer.from(await userPhoto.arrayBuffer());
    const userBase64 = userBuffer.toString("base64");
    const userMimeType = userPhoto.type || "image/jpeg";

    // Descargar imagen de la peluca → base64
    let wigBase64: string;
    let wigMimeType: string;
    try {
      const wigRes = await fetch(wigUrl, { signal: AbortSignal.timeout(15000) });
      if (!wigRes.ok) throw new Error(`HTTP ${wigRes.status}`);
      const wigBuffer = Buffer.from(await wigRes.arrayBuffer());
      wigBase64 = wigBuffer.toString("base64");
      wigMimeType = wigRes.headers.get("content-type") || "image/jpeg";
    } catch (fetchErr: any) {
      return NextResponse.json(
        { error: `No se pudo descargar la imagen de la peluca: ${fetchErr.message}` },
        { status: 400 }
      );
    }

    // Prompt optimizado
    const prompt = `You are a professional hair stylist AI. Take the person from IMAGE 1 (keep face, skin tone, expression, background 100% identical) and make them wear the wig/hair from IMAGE 2. Realistic hairline, natural shadows, photorealistic, 8k, e-commerce photo. Wig name is ${wigName || "VASTI"}. Only change the hair.`;

    // Llamada REAL a Google Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: userMimeType, data: userBase64 } },
              { inlineData: { mimeType: wigMimeType, data: wigBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errorText);
      return NextResponse.json(
        { error: `Error de la IA (${geminiRes.status}): ${errorText}` },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    const textPart = parts.find((p: any) => p.text);

    if (!imagePart) {
      return NextResponse.json(
        { error: "La IA no devolvió una imagen. " + (textPart?.text || JSON.stringify(geminiData)) },
        { status: 500 }
      );
    }

    const resultUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    return NextResponse.json({ result_url: resultUrl });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
