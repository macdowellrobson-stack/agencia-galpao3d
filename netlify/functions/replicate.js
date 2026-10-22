export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt não fornecido." }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // Geração profissional via motor de difusão livre (Flux 1:1, 1024x1024)
    const cleanPrompt = encodeURIComponent(
      `${prompt}, commercial studio product photography, clean background, sharp focus, 8k, realistic lighting`
    );
    const randomSeed = Math.floor(Math.random() * 10000000);
    const generatedUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true&model=flux`;

    // Validação direta da resposta da imagem
    const imgCheck = await fetch(generatedUrl);
    if (!imgCheck.ok) {
      throw new Error("Falha ao contactar o servidor de renderização gratuito.");
    }

    return new Response(JSON.stringify({ output: generatedUrl }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
