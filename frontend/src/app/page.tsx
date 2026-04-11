import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  // Server-side: check for token cookie and redirect appropriately
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  // Token exists but we don't know role on server without decoding —
  // send to a client component that handles the redirect
  redirect("/login");
}
