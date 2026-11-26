import type { Metadata } from "next";
import LoginScreen from "@/components/studio/LoginScreen";

export const instant = false;
export const metadata: Metadata = { title: "Sign in | Admin Panel", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  return <LoginScreen area="ADMIN" next={(await searchParams).next} />;
}
