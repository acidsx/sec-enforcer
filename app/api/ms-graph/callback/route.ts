import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/triage?error=${encodeURIComponent(errorDescription || error)}`,
        url.origin
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/triage?error=missing_code", url.origin)
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(
      new URL("/triage?error=state_mismatch", url.origin)
    );
  }

  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const redirectUri = `${url.origin}/api/ms-graph/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/triage?error=no_client_id", url.origin)
    );
  }

  // Exchange code for tokens
  // NOTE: For confidential clients (server-side), Azure expects client_secret.
  // If your app is configured as a public client (SPA), no secret needed.
  // Azure AD by default treats web apps as confidential — client_secret required.
  const tokenBody = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    scope: "Mail.Read Mail.ReadWrite Mail.Send User.Read offline_access",
  });

  if (process.env.AZURE_CLIENT_SECRET) {
    tokenBody.set("client_secret", process.env.AZURE_CLIENT_SECRET);
  }

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    }
  );

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("[ms-graph] token exchange failed:", errText);
    return NextResponse.redirect(
      new URL(
        `/triage?error=${encodeURIComponent(`token_exchange:${tokenRes.status}`)}`,
        url.origin
      )
    );
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

  const { error: dbError } = await supabase.from("ms_graph_tokens").upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (dbError) {
    console.error("[ms-graph] db upsert failed:", dbError.message);
    return NextResponse.redirect(
      new URL(
        `/triage?error=${encodeURIComponent(`db:${dbError.message}`)}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL("/triage?connected=1", url.origin));
}
