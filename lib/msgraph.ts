import { createClient } from "@/lib/supabase/server";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

/**
 * Get a valid MS Graph access token for a user.
 * Refreshes automatically if expired.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: tokens, error } = await supabase
    .from("ms_graph_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokens) {
    throw new Error("No MS Graph tokens found. Connect Outlook first.");
  }

  // Check if token is still valid (with 60s buffer)
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  now.setSeconds(now.getSeconds() + 60);

  if (expiresAt > now) {
    return tokens.access_token;
  }

  // Refresh the token
  const refreshRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      scope: "Mail.Read Mail.ReadWrite Mail.Send User.Read offline_access",
    }),
  });

  if (!refreshRes.ok) {
    throw new Error("Failed to refresh MS Graph token. Re-connect Outlook.");
  }

  const refreshData = await refreshRes.json();

  const newExpiresAt = new Date();
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshData.expires_in);

  await supabase
    .from("ms_graph_tokens")
    .update({
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token || tokens.refresh_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return refreshData.access_token;
}

/**
 * Fetch from MS Graph API with automatic token handling.
 * Retries once on 401 (token refresh).
 */
export async function msGraphFetch(
  userId: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  let token = await getValidAccessToken(userId);

  let res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  // Retry once on 401
  if (res.status === 401) {
    // Force refresh by invalidating the cached token
    const supabase = await createClient();
    await supabase
      .from("ms_graph_tokens")
      .update({ expires_at: new Date(0).toISOString() })
      .eq("user_id", userId);

    token = await getValidAccessToken(userId);
    res = await fetch(`${GRAPH_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }

  return res;
}
