import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/ms-graph/callback`;

  if (!clientId) {
    return new Response("AZURE_CLIENT_ID not configured", { status: 500 });
  }

  // State = user_id para verificar en callback (en prod usar random + storage)
  const state = user.id;

  const scopes = [
    "Mail.Read",
    "Mail.ReadWrite",
    "Mail.Send",
    "User.Read",
    "offline_access",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: scopes,
    state,
    prompt: "consent",
  });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
