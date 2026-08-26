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

    // 3. Construir el payload para Gemini
    const prompt = `You are a professional hair stylist AI. Take the person from IMAGE 1 (keep face, skin tone, expression, background 100% identical) and make them wear the wig/hair from IMAGE 2. Realistic hairline, natural shadows, photorealistic, 8k, e-commerce photo. Wig name is ${wigName}. Only change the hair.`;

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

    // NOTA: "gemini-2.0-flash-exp" es el modelo público real actual que soporta generación de imágenes. 
    // Si tu clave tiene acceso específico a "gemini-2.5-flash-image-preview", cambiá el string aquí abajo.
    const modelName = "gemini-2.0-flash-exp"; 
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
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          resultBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break;
        }
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
