import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // If this is an Azure OAuth login, persist MS Graph tokens
    if (data?.session?.provider_token && data?.session?.provider_refresh_token) {
      const userId = data.session.user.id;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.session.expires_in || 3600));

      await supabase.from("ms_graph_tokens").upsert(
        {
          user_id: userId,
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
