import type { Metadata } from "next";
import LoginScreen from "@/components/studio/LoginScreen";

export const instant = false;
export const metadata: Metadata = { title: "Sign in | SEO Studio", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  return <LoginScreen area="SEO" next={(await searchParams).next} />;
}
