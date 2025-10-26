"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { FlipbookViewerV2 } from "@/components/flipbooks/FlipbookViewerV2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ExternalLink, Eye, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShareLinkViewerProps {
  token: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ShareLinkViewer({ token, searchParams }: ShareLinkViewerProps) {
  const router = useRouter();
  const [viewTracked, setViewTracked] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Password protection state
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Parse search params
  const theme = (searchParams.theme as string) || undefined;
  const startPage = searchParams.page
    ? parseInt(searchParams.page as string)
    : undefined;
  const _showControls = searchParams.controls !== "false";
  const _autoPlay = searchParams.autoplay === "true";

  // Fetch share link and flipbook data
  const {
    data: shareLink,
    isLoading,
    error,
  } = api.flipbooks.getShareLinkByToken.useQuery({
    token,
  });

  // Track view mutation
  const trackViewMutation = api.flipbooks.trackShareLinkView.useMutation();

  // Track view on mount
  useEffect(() => {
    if (!shareLink || viewTracked) return;

    const trackView = async () => {
      try {
        // Get client IP and user agent
        const userAgent = navigator.userAgent;
        const referrer = document.referrer;

        // Track the view
        await trackViewMutation.mutateAsync({
          token,
          viewerUserAgent: userAgent,
          referrer: referrer || undefined,
          sessionId,
        });

        setViewTracked(true);
      } catch (error) {
        console.error("Failed to track share link view:", error);
      }
    };

    trackView();
  }, [shareLink, viewTracked, token, sessionId, trackViewMutation]);

  // Apply theme from share link settings or URL param
  useEffect(() => {
    // TypeScript fix: Type assertion needed due to complex spread in getShareLinkByToken
    const effectiveTheme =
      theme || ((shareLink as any)?.settings as any)?.theme || "auto";

    if (effectiveTheme === "auto") {
      // Use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (effectiveTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, shareLink]);

  // Password verification mutation
  const verifyPasswordMutation = api.flipbooks.verifyShareLinkPassword.useMutation();

  // Handle password verification
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordInput) {
      setPasswordError("Please enter a password");
      return;
    }

    setIsVerifying(true);
    setPasswordError(null);

    try {
      const result = await verifyPasswordMutation.mutateAsync({
        token,
        password: passwordInput,
      });

      if (result.verified) {
        setPasswordVerified(true);
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setPasswordError("Incorrect password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [token, passwordInput, verifyPasswordMutation]);

  // Check if password is required
  const hasPassword = shareLink && (shareLink as any)?.settings?.password;
  const needsPassword = hasPassword && !passwordVerified;

  // Handle hotspot click
  const handleHotspotClick = useCallback((hotspot: any) => {
    // If there's a product link, open it
    if (hotspot.product_id && hotspot.products) {
      const productUrl = `/products/${hotspot.product_id}`;
      window.open(productUrl, "_blank");
    }

    // If there's a custom URL, open it
    if (hotspot.hotspot_type === "link" && hotspot.content) {
      try {
        const contentData = JSON.parse(hotspot.content);
        if (contentData.url) {
          window.open(contentData.url, "_blank");
        }
      } catch (e) {
        console.error("Failed to parse hotspot content:", e);
      }
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading flipbook...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error) {
    const errorMessage = error.message;
    const isExpired = errorMessage.includes("expired");
    const isDeactivated = errorMessage.includes("deactivated");
    const isNotFound = errorMessage.includes("not found");

    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isExpired && "Link Expired"}
              {isDeactivated && "Link Deactivated"}
              {isNotFound && "Link Not Found"}
              {!isExpired && !isDeactivated && !isNotFound && "Error"}
            </AlertTitle>
            <AlertDescription>
              {isExpired &&
                "This share link has expired and is no longer accessible."}
              {isDeactivated &&
                "This share link has been deactivated by the owner."}
              {isNotFound &&
                "This share link does not exist or has been deleted."}
              {!isExpired && !isDeactivated && !isNotFound && errorMessage}
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!shareLink || !shareLink.flipbooks) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Flipbook Found</AlertTitle>
            <AlertDescription>
              This share link does not have an associated flipbook.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // TypeScript fix: Type assertion needed due to complex spread in getShareLinkByToken
  const flipbook = shareLink.flipbooks as any;
  const settings = (shareLink as any).settings as any;

  // Determine effective start page
  const effectiveStartPage =
    startPage || settings?.startPage || 1;

  // Show password dialog if password is required and not yet verified
  if (needsPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full">
          <Dialog open={true}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <DialogTitle>Password Protected</DialogTitle>
                </div>
                <DialogDescription>
                  This flipbook is password protected. Please enter the password to continue.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    disabled={isVerifying}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || !passwordInput}
                >
                  {isVerifying ? "Verifying..." : "Access Flipbook"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header with flipbook title and view count */}
      <div className="border-b px-4 py-3 bg-card">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-semibold text-lg">{flipbook.title}</h1>
            {flipbook.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {flipbook.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {/* TypeScript fix: Type assertion needed due to complex spread in getShareLinkByToken */}
            <span>{(shareLink as any).view_count.toLocaleString()} views</span>
          </div>
        </div>
      </div>

      {/* Flipbook viewer */}
      <div className="flex-1 overflow-hidden">
        <FlipbookViewerV2
          pages={flipbook.flipbook_pages as any}
          initialPage={effectiveStartPage}
          onHotspotClick={handleHotspotClick}
          backgroundColor="#f5f5f5"
        />
      </div>

      {/* Footer with branding */}
      <div className="border-t px-4 py-2 bg-card">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>
            Powered by{" "}
            <a
              href="https://limn.systems"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
            >
              Limn Systems
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
