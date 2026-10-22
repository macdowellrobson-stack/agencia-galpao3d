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

    const response = await fetch("https://api.replicate.com/v1/models/bria/product-photography/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          image: image,
          prompt: prompt
        }
      })
    });

    const prediction = await response.json();

    if (prediction.error) {
      return new Response(JSON.stringify({ error: prediction.error }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    let result = prediction;
    let attempts = 0;

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(result.urls.get, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      result = await poll.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return new Response(JSON.stringify({ output: outputUrl }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Tempo limite esgotado" }), {
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
