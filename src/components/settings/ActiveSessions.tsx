"use client";

import { api } from "@/lib/api/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Shield,
  ShieldAlert,
  Trash2,
  LogOut,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ActiveSessionsProps {
  className?: string;
}

export function ActiveSessions({ className }: ActiveSessionsProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(null);
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false);

  // Fetch active sessions
  const { data: sessionsData, isLoading } = api.sessions.getActiveSessions.useQuery();
  const { data: statsData } = api.sessions.getSecurityStats.useQuery();

  // Mutations
  const terminateSession = api.sessions.terminateSession.useMutation({
    onSuccess: () => {
      toast({
        title: "Session terminated",
        description: "The session has been successfully terminated.",
      });
      utils.sessions.getActiveSessions.invalidate();
      utils.sessions.getSecurityStats.invalidate();
      setSessionToTerminate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const terminateAllOther = api.sessions.terminateAllOtherSessions.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sessions terminated",
        description: `${data.terminatedCount} session(s) terminated successfully.`,
      });
      utils.sessions.getActiveSessions.invalidate();
      utils.sessions.getSecurityStats.invalidate();
      setShowTerminateAllDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTerminateSession = (sessionId: string) => {
    terminateSession.mutate({
      sessionTrackingId: sessionId,
      reason: "User requested termination",
    });
  };

  const handleTerminateAllOther = () => {
    terminateAllOther.mutate({
      currentSessionId: undefined, // Will be determined server-side
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Monitor;
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground">Loading sessions...</div>
      </div>
    );
  }

  const sessions = sessionsData?.sessions || [];
  const stats = statsData?.stats;

  return (
    <div className={className}>
      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Active Sessions</div>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Unique IPs</div>
            <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Locations</div>
            <div className="text-2xl font-bold">{stats.uniqueLocations}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Suspicious</div>
            <div className="text-2xl font-bold text-destructive">
              {stats.suspiciousSessions}
            </div>
          </div>
        </div>
      )}

      {/* Terminate All Button */}
      {sessions.length > 1 && (
        <div className="mb-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowTerminateAllDialog(true)}
            disabled={terminateAllOther.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out All Other Devices
          </Button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found
          </div>
        ) : (
          sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.deviceType);

            return (
              <div
                key={session.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  <DeviceIcon className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">
                      {session.browser} on {session.os}
                    </div>
                    {session.isSuspicious && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        Suspicious
                      </Badge>
                    )}
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current Session
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{session.ipAddress}</span>
                      {session.geoLocation && (
                        <span>
                          • {session.geoLocation.city || "Unknown"}, {session.geoLocation.country || "Unknown"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {formatLastActivity(session.lastActivityAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>Signed in: {new Date(session.loginAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSessionToTerminate(session.id)}
                      disabled={terminateSession.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminate Session Dialog */}
      <AlertDialog open={!!sessionToTerminate} onOpenChange={(open) => !open && setSessionToTerminate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session? This action cannot be undone.
              The user will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToTerminate && handleTerminateSession(sessionToTerminate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate All Dialog */}
      <AlertDialog open={showTerminateAllDialog} onOpenChange={setShowTerminateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Other Devices</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all other devices and sessions. You will remain
              signed in on this device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateAllOther}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
