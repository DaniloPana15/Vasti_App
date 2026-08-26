import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!hfApiKey) {
      return NextResponse.json(
        { error: "Falta HUGGINGFACE_API_KEY en Vercel" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const wigUrl = formData.get("wig_url") as string;
    const wigName = formData.get("wig_name") as string;

    if (!imageFile || !wigUrl) {
      return NextResponse.json(
        { error: "Faltan imágenes" },
        { status: 400 }
      );
    }

    // 1. Descargar la peluca (para usarla como referencia visual en el prompt)
    const wigResponse = await fetch(wigUrl);
    if (!wigResponse.ok) {
      throw new Error(`No se pudo descargar la peluca: ${wigResponse.status}`);
    }

    // 2. Obtener los bytes de la foto del usuario
    const userBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 3. Prompt específico para virtual try-on
    const prompt = `Change the person's hair to match a ${wigName} wig style. Keep the face, skin, expression, and background 100% identical. Only change the hair.`;

    // 4. Llamar a Hugging Face con el formato CORRECTO
    // instruct-pix2pix espera: imagen como bytes + prompt como query param
    const hfUrl = `https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix?prompt=${encodeURIComponent(prompt)}`;
    
    const response = await fetch(hfUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "X-Wait-For-Model": "true", // ⚠️ CLAVE: espera a que el modelo cargue
        "Content-Type": imageFile.type || "image/jpeg",
      },
      body: userBuffer, // ️ La imagen va como bytes, NO como JSON
    });

    // 5. Manejar respuesta
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face error:", response.status, errorText);
      
      if (response.status === 503) {
        return NextResponse.json(
          { error: "El modelo está cargando (30-60 seg). Esperá y probá de nuevo." },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Error IA (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    // 6. La respuesta viene como imagen directa (bytes)
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageBlob.type || "image/png";
    
    return NextResponse.json({ 
      result_url: `data:${mimeType};base64,${base64Image}` 
    });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Error de conexión con la IA" },
      { status: 500 }
    );
  }
}
