const PUBLIC_BASE = (Deno.env.get("SUPABASE_PUBLIC_URL") ?? "https://supabase-picasso.wems.ao").replace(/\/$/, "");
const INTERNAL = (Deno.env.get("SUPABASE_URL") ?? PUBLIC_BASE).replace(/\/$/, "");
const STORAGE_HOST = "supabase-picasso.wems.ao";
const OPENAI_URL = "https://api.openai.com/v1/images/edits";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function envValue(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value && !value.startsWith("${")) return value;
  }
  return "";
}

async function openAiKey() {
  const fromEnv = envValue("OPENAI_API_KEY");
  if (fromEnv) return fromEnv;
  try {
    const file = (await Deno.readTextFile("/home/deno/functions/generate-fusion/openai.key")).trim();
    if (file && !file.startsWith("${")) return file;
  } catch {
    return "";
  }
  return "";
}

function storageUrl(value: unknown, label: string) {
  if (typeof value !== "string" || !value) throw new Error(`${label} is required.`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a storage URL.`);
  }
  if (url.protocol !== "https:" || url.hostname !== STORAGE_HOST || !url.pathname.startsWith("/storage/v1/")) {
    throw new Error(`${label} must come from studio storage.`);
  }
  return url.toString();
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function readStudioImage(source: string, serviceKey: string) {
  const url = new URL(source);
  const response = await fetch(`${INTERNAL}${url.pathname}${url.search}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) throw new Error("A studio image could not be read.");
  const type = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return `data:${type};base64,${encodeBase64(bytes)}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const anonKey = envValue("SUPABASE_ANON_KEY", "SERVICE_SUPABASEANON_KEY");
  const serviceKey = envValue("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_SUPABASESERVICE_KEY");
  const openaiKey = await openAiKey();
  if (!anonKey || !serviceKey || !openaiKey) return json({ error: "Fusion secrets are not configured on the server." }, 500);

  const header = request.headers.get("Authorization") ?? "";
  const userJwt = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!userJwt) return json({ error: "Sign in before generating a fusion." }, 401);

  const userResponse = await fetch(`${INTERNAL}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${userJwt}` },
  });
  if (!userResponse.ok) return json({ error: "Sign in before generating a fusion." }, 401);
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return json({ error: "Sign in before generating a fusion." }, 401);

  let originalImageUrl = "";
  let styleImageUrl = "";
  let promptInstruction = "";
  let frameConfig: Record<string, unknown> = {};
  try {
    const body = (await request.json()) as {
      originalImageUrl?: unknown;
      styleImageUrl?: unknown;
      promptInstruction?: unknown;
      frameConfig?: unknown;
    };
    originalImageUrl = storageUrl(body.originalImageUrl, "The portrait");
    styleImageUrl = storageUrl(body.styleImageUrl, "The style image");
    promptInstruction = typeof body.promptInstruction === "string" ? body.promptInstruction.trim().slice(0, 4000) : "";
    if (body.frameConfig && typeof body.frameConfig === "object" && !Array.isArray(body.frameConfig)) {
      frameConfig = body.frameConfig as Record<string, unknown>;
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "The fusion request was invalid." }, 400);
  }

  const serviceHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const spent = await fetch(`${INTERNAL}/rest/v1/rpc/spend_credit`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ target: user.id }),
  });
  const creditsRemaining = (await spent.json().catch(() => null)) as number | null;
  if (!spent.ok) return json({ error: "Credits could not be checked." }, 500);
  if (typeof creditsRemaining !== "number") return json({ error: "No credits remaining." }, 402);

  const refund = async () => {
    await fetch(`${INTERNAL}/rest/v1/rpc/refund_credit`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({ target: user.id }),
    });
  };

  let originalDataUrl = "";
  let styleDataUrl = "";
  try {
    originalDataUrl = await readStudioImage(originalImageUrl, serviceKey);
    styleDataUrl = await readStudioImage(styleImageUrl, serviceKey);
  } catch (error) {
    await refund();
    return json({ error: error instanceof Error ? error.message : "A studio image could not be read." }, 502);
  }

  const prompt = [
    "Create one museum portrait. Keep the person's identity from the first image.",
    "Apply the visual style, palette, and surface of the second image.",
    promptInstruction,
    "No text, no frame, no collage, and no triptych.",
  ]
    .filter(Boolean)
    .join(" ");

  const ai = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-2.5-sunburst",
      images: [{ image_url: originalDataUrl }, { image_url: styleDataUrl }],
      prompt,
      quality: "medium",
      size: "1024x1536",
      output_format: "png",
      n: 1,
    }),
  });
  const aiBody = (await ai.json().catch(() => null)) as { data?: { b64_json?: string }[]; error?: { message?: string } } | null;
  const encoded = aiBody?.data?.[0]?.b64_json;
  if (!ai.ok || !encoded) {
    await refund();
    return json({ error: aiBody?.error?.message || "The portrait could not be generated." }, 502);
  }

  const bytes = decodeBase64(encoded);
  const path = `${user.id}/${crypto.randomUUID()}.png`;
  const upload = await fetch(`${INTERNAL}/storage/v1/object/outputs/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/png",
      "x-upsert": "false",
    },
    body: bytes,
  });
  if (!upload.ok) {
    await refund();
    return json({ error: "The portrait was generated but could not be stored." }, 502);
  }

  const signed = await fetch(`${INTERNAL}/storage/v1/object/sign/outputs/${path}`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ expiresIn: 60 * 60 * 24 }),
  });
  const signedBody = (await signed.json().catch(() => null)) as { signedURL?: string } | null;
  if (!signed.ok || !signedBody?.signedURL) {
    await refund();
    return json({ error: "The portrait was stored but could not be opened." }, 502);
  }
  const fusionUrl = `${PUBLIC_BASE}/storage/v1${signedBody.signedURL}`;

  const saved = await fetch(`${INTERNAL}/rest/v1/quadres`, {
    method: "POST",
    headers: { ...serviceHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      original_url: originalImageUrl,
      fusion_url: fusionUrl,
      style_url: styleImageUrl,
      frame_config: frameConfig,
    }),
  });
  if (!saved.ok) {
    await refund();
    return json({ error: "The portrait was stored but the studio record could not be saved." }, 502);
  }

  return json({ fusionUrl, creditsRemaining });
});
