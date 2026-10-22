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
    const { image, prompt, token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Token da Replicate não informado" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // 1. Criar predição no modelo oficial de composição de produto / inpainting
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Modelo flux-schnell / inpainting otimizado para staging de produto
        version: "55360383cb767929a0812d496a84592233c7c2514bc7c2da4a896d8e87d49818",
        input: {
          prompt: prompt,
          image: image,
          num_outputs: 1,
          output_format: "jpg"
        }
      })
    });

    const prediction = await createRes.json();

    if (prediction.error || prediction.detail) {
      const msg = prediction.error || prediction.detail || "Erro ao iniciar predição no Replicate";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    if (!prediction.urls || !prediction.urls.get) {
      return new Response(JSON.stringify({ error: "Resposta inválida da API do Replicate." }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // 2. Aguardar conclusão da geração
    let result = prediction;
    let attempts = 0;

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 40) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const pollRes = await fetch(result.urls.get, {
        headers: { "Authorization": `Bearer ${token.trim()}` }
      });
      result = await pollRes.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return new Response(JSON.stringify({ output: outputUrl }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    } else {
      const failureReason = result.error || "A renderização excedeu o tempo limite.";
      return new Response(JSON.stringify({ error: failureReason }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
