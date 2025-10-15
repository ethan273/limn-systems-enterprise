'use client';

import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoPath = resolvedTheme === 'dark' ? '/images/Limn_Logo_Dark_Mode.png' : '/images/Limn_Logo_Light_Mode.png';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          {!mounted && <div style={{ width: 240, height: 67 }} />}
          {mounted && (
            <Image
              key={`logo-${resolvedTheme}`}
              src={logoPath}
              alt="Limn Systems"
              width={240}
              height={67}
              priority
              unoptimized
            />
          )}
        </div>
        <p className="text-xl text-secondary mb-8">
          Enterprise Management Platform
        </p>
        <Link
          href="/dashboard"
          className="inline-block btn-primary hover:btn-primary text-foreground px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}