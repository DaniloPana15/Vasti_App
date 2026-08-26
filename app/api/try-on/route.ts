import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!hfApiKey) {
      return NextResponse.json(
        { error: "Falta HUGGINGFACE_API_KEY. Creá cuenta en huggingface.co" },
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

    // Descargar peluca
    const wigResponse = await fetch(wigUrl);
    const wigBuffer = Buffer.from(await wigResponse.arrayBuffer());
    
    // Convertir usuario a base64
    const userBuffer = Buffer.from(await imageFile.arrayBuffer());
    const userBase64 = userBuffer.toString("base64");

    // Prompt para cambiar pelo
    const prompt = `Professional photo of person wearing ${wigName} wig, photorealistic, natural hairline, keep face identical`;

    // Usar InstructPix2Pix (mejor para editar imágenes)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            image: userBase64,
            prompt: prompt,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Hugging Face error:", error);
      
      // Si el modelo está cargando, esperar
      if (response.status === 503) {
        return NextResponse.json(
          { error: "El modelo está cargando. Esperá 30 segundos y probá de nuevo." },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Error IA: ${response.status}` },
        { status: response.status }
      );
    }

    // Hugging Face devuelve la imagen directamente
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageBlob.type || "image/png";
    
    return NextResponse.json({ 
      result_url: `data:${mimeType};base64,${base64Image}` 
    });

  } catch (err: any) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
