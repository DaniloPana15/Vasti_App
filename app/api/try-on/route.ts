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
    const wigName = formData.get("wig_name") as string;

    // Prompt ultra-específico para virtual try-on de pelucas
    const prompt = `Virtual hair try-on. Take the exact person from the uploaded user photo (keep their face, expression, skin tone, and features 100% identical and recognizable). Place the wig/hair style from the reference image onto this person. The hair must look naturally worn — correct hairline, realistic shadows on the face and neck, matching the person's skin tone and lighting. The result should look like a real photo of this person wearing this wig. Photorealistic, high quality, same background as the user photo.`;

    formData.append("prompt", prompt);

    const res = await fetch("https://api.nano-banana.com/v1/try-on", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Nano Banana error:", res.status, errorText);
      return NextResponse.json(
        { error: `Error de la IA (${res.status}): ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Nano Banana puede devolver la URL en diferentes campos
    const resultUrl = data.result_url || data.image_url || data.url || data.output;

    if (!resultUrl) {
      return NextResponse.json(
        { error: "La IA no devolvió una imagen. Respuesta: " + JSON.stringify(data) },
        { status: 500 }
      );
    }

    return NextResponse.json({ result_url: resultUrl });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
