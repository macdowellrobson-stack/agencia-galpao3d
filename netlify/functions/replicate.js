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

    // Chamada oficial ao endpoint canónico do modelo (versão automática estável)
    const createRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-fill-dev/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        "Prefer": "wait=55"
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          image: image,
          guidance: 30,
          output_format: "jpg"
        }
      })
    });

    const prediction = await createRes.json();

    if (prediction.error || prediction.detail) {
      const msg = prediction.error || prediction.detail || "Erro ao iniciar no Replicate";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // Se o Replicate já devolver o resultado concluído
    if (prediction.status === "succeeded" && prediction.output) {
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return new Response(JSON.stringify({ output: outputUrl }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // Polling caso o processamento demore alguns segundos
    let result = prediction;
    let attempts = 0;
    const pollUrl = prediction.urls?.get;

    if (!pollUrl) {
      return new Response(JSON.stringify({ error: "URL de consulta não recebido da Replicate." }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 35) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollRes = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${token.trim()}` }
      });
      result = await pollRes.json();
      attempts++;
    }

    if (result.status === "succeeded" && result.output) {
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
