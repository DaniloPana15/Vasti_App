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
    const imageFile = formData.get("image") as File;
    const wigUrl = formData.get("wig_url") as string;
    const wigName = formData.get("wig_name") as string;

    if (!imageFile || !wigUrl) {
      return NextResponse.json(
        { error: "Faltan la imagen del usuario o la URL de la peluca." },
        { status: 400 }
      );
    }

    // 1. Convertir la foto del usuario a Base64
    const userImageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const userImageBase64 = userImageBuffer.toString("base64");
    const userImageMimeType = imageFile.type || "image/jpeg";

    // 2. Descargar la imagen de la peluca a Buffer
    const wigResponse = await fetch(wigUrl);
    if (!wigResponse.ok) {
      throw new Error(`No se pudo descargar la imagen de la peluca: ${wigResponse.status}`);
    }
    const wigBuffer = Buffer.from(await wigResponse.arrayBuffer());
    const wigBase64 = wigBuffer.toString("base64");
    const wigMimeType = wigResponse.headers.get("content-type") || "image/jpeg";

    // 3. Construir el payload para Gemini con el prompt optimizado
    const prompt = `Task: Virtual wig try-on.
IMAGE 1 is the USER - you must preserve this person 100%: same face, same facial features, same skin tone, same eyes, same eyebrows, same makeup, same expression, same background, same lighting, same clothes.
IMAGE 2 is the WIG REFERENCE - extract ONLY the hair/wig style, color, texture, and bangs from this image.
Generate a new photorealistic image of the person from IMAGE 1 wearing the wig from IMAGE 2.
- Keep identity identical, do not change face shape.
- Create a natural, realistic hairline.
- The hair should have realistic shadows on forehead and neck.
- High quality, 8k, studio lighting, e-commerce style.
- Only the hair changes, everything else stays identical.
- Wig name for context: ${wigName}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: userImageMimeType, data: userImageBase64 } },
            { inlineData: { mimeType: wigMimeType, data: wigBase64 } }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    };

    // Usar el modelo correcto: gemini-2.5-flash-image-preview
    const modelName = "gemini-2.5-flash-image-preview";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", res.status, errorText);
      return NextResponse.json(
        { error: `Error de la IA (${res.status}): ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // 4. Extraer la imagen generada de la respuesta de Gemini
    let resultBase64 = "";
    let mimeType = "image/png";

    if (data.candidates && data.candidates[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;
      const imageData = parts.find((p: any) => p.inlineData);
      if (imageData && imageData.inlineData) {
        resultBase64 = imageData.inlineData.data;
        mimeType = imageData.inlineData.mimeType || "image/png";
      }
    }

    if (!resultBase64) {
      console.error("Gemini response without image:", JSON.stringify(data));
      return NextResponse.json(
        { error: "La IA no devolvió una imagen. Respuesta: " + JSON.stringify(data) },
        { status: 500 }
      );
    }

    // Devolver como Data URL para que Next.js Image lo renderice directamente
    const resultUrl = `data:${mimeType};base64,${resultBase64}`;
    return NextResponse.json({ result_url: resultUrl });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
