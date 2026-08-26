import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta REPLICATE_API_TOKEN. Configurá en Vercel → Settings → Environment Variables" },
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

    // 1. Descargar la imagen de la peluca
    const wigResponse = await fetch(wigUrl);
    if (!wigResponse.ok) {
      throw new Error(`No se pudo descargar la peluca: ${wigResponse.status}`);
    }
    const wigBuffer = Buffer.from(await wigResponse.arrayBuffer());
    const wigBase64 = wigBuffer.toString("base64");

    // 2. Convertir foto del usuario a base64
    const userBuffer = Buffer.from(await imageFile.arrayBuffer());
    const userBase64 = userBuffer.toString("base64");

    // 3. Crear prompt específico para virtual try-on
    const prompt = `Professional photo of a person wearing a ${wigName} wig. Photorealistic, high quality, natural hairline, studio lighting, e-commerce photo. Keep the person's face 100% identical.`;

    // 4. Llamar a Replicate API (SDXL con img2img)
    const createPrediction = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL v1.0
        input: {
          image: `data:image/jpeg;base64,${userBase64}`,
          prompt: prompt,
          prompt_strength: 0.75, // Cuanto más alto, más cambia la imagen
          num_inference_steps: 50, // Calidad (más = mejor pero más lento)
          guidance_scale: 7.5, // Qué tanto sigue el prompt
          image_dimensions: "512x512",
          num_outputs: 1
        }
      })
    });

    if (!createPrediction.ok) {
      const error = await createPrediction.text();
      console.error("Replicate create error:", error);
      return NextResponse.json(
        { error: `Error al crear predicción: ${createPrediction.status}` },
        { status: createPrediction.status }
      );
    }

    const prediction = await createPrediction.json();
    console.log("Prediction created:", prediction.id);

    // 5. Esperar a que termine (polling)
    let result;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60 segundos máximo

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { "Authorization": `Token ${apiKey}` }
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Error checking status: ${statusResponse.status}`);
      }

      result = await statusResponse.json();
      console.log(`Attempt ${attempts + 1}: Status = ${result.status}`);

      if (result.status === "succeeded") {
        break;
      }

      if (result.status === "failed" || result.status === "canceled") {
        throw new Error(`Generación fallida: ${result.error || "Error desconocido"}`);
      }

      attempts++;
    }

    if (!result || !result.output) {
      throw new Error("Timeout: la generación tardó demasiado");
    }

    // 6. Devolver la URL de la imagen generada
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    
    console.log("Image generated successfully:", imageUrl);
    
    return NextResponse.json({ 
      result_url: imageUrl 
    });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
