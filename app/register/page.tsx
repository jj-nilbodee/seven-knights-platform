"use client";

import { useState } from "react";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            สมัครสมาชิก
          </h1>
          <p className="text-sm text-text-secondary">
            สร้างบัญชีเพื่อเข้าใช้งานระบบกิลด์
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-accent hover:text-accent-bright">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
