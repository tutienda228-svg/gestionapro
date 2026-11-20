import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * - Refresca la sesión de Supabase en cada request (requisito de @supabase/ssr).
 * - Protege las rutas de la app: sin sesión -> /login.
 * - Si hay sesión pero el usuario no tiene ninguna organización -> /onboarding.
 * La resolución de la organización ACTIVA (cuál de varias) se hace en
 * lib/auth/get-current-org.ts, en el servidor, nunca a partir de un valor del cliente.
 */
const PUBLIC_PATHS = ["/", "/precios", "/login", "/registro", "/recuperar", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/"); // webhooks, cron y endpoints de PDF manejan su propia auth
  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith("/p/"));
  const isQuotationPublicLink = path.startsWith("/p/"); // vista pública de cotización, sin login

  if (!user && !isPublicPath && !isQuotationPublicLink && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path !== "/onboarding" && !isPublicPath && !isApiRoute) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (!memberships || memberships.length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
