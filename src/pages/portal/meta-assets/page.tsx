import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Megaphone,
  RefreshCw,
  Unlink,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Save,
  Key,
  Activity,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import GlobalAssetPool from "./_components/global-asset-pool.tsx";
import CapiEventToggles from "./_components/capi-event-toggles.tsx";
import CapiEventLog from "./_components/capi-event-log.tsx";
import TestEventsPanel from "./_components/test-events-panel.tsx";

export default function MetaAssetsPage() {
  const { isAdmin } = useUserRole();
  const assets = useQuery(api.metaAssets.list);
  const connectionStatus = useQuery(api.meta.settings.getConnectionStatus);
  const credentialsDisplay = useQuery(api.meta.settings.getCredentialsDisplay);
  const saveCredentials = useMutation(api.meta.settings.saveCredentials);
  const removeAsset = useMutation(api.metaAssets.remove);
  const addAsset = useMutation(api.metaAssets.add);
  const disconnectMeta = useMutation(api.meta.settings.disconnect);
  const toggleCapi = useMutation(api.meta.settings.toggleCapi);
  const getOAuthUrl = useAction(api.meta.actions.getOAuthUrl);
  const connectWithToken = useAction(api.meta.actions.connectWithToken);
  const checkAssetHealth = useAction(api.meta.healthCheck.checkAllAssets);
  const resyncAssets = useAction(api.meta.actions.resyncWithStoredToken);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  // Track whether we've done the auto-check for this page mount
  const hasAutoChecked = useRef(false);

  // Credentials form state
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);

  // Manual token state
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isConnectingToken, setIsConnectingToken] = useState(false);

  // Handle OAuth redirect params
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get("meta_connected");
    const error = searchParams.get("meta_error");

    if (connected === "true") {
      const adAccounts = searchParams.get("meta_ad_accounts") ?? "0";
      const pixels = searchParams.get("meta_pixels") ?? "0";
      const pages = searchParams.get("meta_pages") ?? "0";
      const user = searchParams.get("meta_user") ?? "your account";

      toast.success(
        `Connected as ${user}! Imported ${adAccounts} ad account(s), ${pixels} pixel(s), ${pages} page(s).`,
      );
      setSearchParams({}, { replace: true });
    } else if (error) {
      const messages: Record<string, string> = {
        denied: "Facebook login was cancelled",
        exchange_failed: "Failed to connect to Facebook. Please try again.",
      };
      toast.error(messages[error] ?? "Failed to connect to Facebook");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Pre-fill App ID if already saved
  useEffect(() => {
    if (credentialsDisplay?.metaAppId && !appId) {
      setAppId(credentialsDisplay.metaAppId);
    }
  }, [credentialsDisplay, appId]);

  // Health check handler
  const runHealthCheck = useCallback(async (silent = false) => {
    setIsCheckingHealth(true);
    try {
      const result = await checkAssetHealth();
      if (!silent) {
        if (result.flaggedForRelaunch > 0) {
          toast.warning(
            `${result.flaggedForRelaunch} campaign(s) flagged for relaunch. Check the Relaunch tab in Campaigns.`,
          );
        } else if (result.errors > 0) {
          toast.warning(
            `Health check complete: ${result.errors} of ${result.checked} asset(s) need attention`,
          );
        } else {
          toast.success(`All ${result.checked} asset(s) are healthy`);
        }
      }
    } catch (error) {
      if (!silent) {
        if (error instanceof ConvexError) {
          const data = error.data as { message: string };
          toast.error(data.message);
        } else {
          toast.error("Health check failed");
        }
      }
    } finally {
      setIsCheckingHealth(false);
    }
  }, [checkAssetHealth]);

  // Auto-check health on page load when connected and has assets
  useEffect(() => {
    if (
      !hasAutoChecked.current &&
      assets !== undefined &&
      assets.all.length > 0 &&
      connectionStatus?.connected
    ) {
      hasAutoChecked.current = true;
      runHealthCheck(true);
    }
  }, [assets, connectionStatus, runHealthCheck]);

  if (assets === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  const hasCredentials = connectionStatus?.hasCredentials ?? false;
  const isConnected = connectionStatus?.connected ?? false;

  const handleSaveCredentials = async () => {
    if (!appId.trim() || !appSecret.trim()) {
      toast.error("Both App ID and App Secret are required");
      return;
    }
    setIsSavingCreds(true);
    try {
      await saveCredentials({
        metaAppId: appId.trim(),
        metaAppSecret: appSecret.trim(),
      });
      toast.success("Meta credentials saved! You can now sync with Facebook.");
      setAppSecret("");
      setShowCredentialsForm(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to save credentials");
      }
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleSyncWithFacebook = async () => {
    setIsConnecting(true);
    try {
      const convexUrl = (import.meta.env.VITE_CONVEX_URL as string) ?? "";
      const httpActionsUrl = convexUrl.replace(".cloud", ".site");
      const redirectUri = `${httpActionsUrl}/meta-oauth-callback`;

      // Pass the frontend origin so the callback can redirect back here
      const oauthUrl = await getOAuthUrl({
        redirectUri,
        frontendOrigin: window.location.origin,
      });
      window.location.href = oauthUrl;
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to start Facebook connection");
      }
      setIsConnecting(false);
    }
  };

  const handleConnectWithToken = async () => {
    if (!manualToken.trim()) {
      toast.error("Please paste an access token");
      return;
    }
    setIsConnectingToken(true);
    try {
      const result = await connectWithToken({ accessToken: manualToken.trim() });
      toast.success(
        `Connected as ${result.userName}! Found ${result.adAccounts} ad account(s), ${result.pixels} pixel(s), ${result.pages} page(s).`,
      );
      setManualToken("");
      setShowTokenInput(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to connect with token");
      }
    } finally {
      setIsConnectingToken(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMeta();
      toast.success("Meta account disconnected");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleResync = async () => {
    setIsResyncing(true);
    try {
      const result = await resyncAssets();
      toast.success(
        `Re-synced as ${result.userName}! Found ${result.adAccounts} ad account(s), ${result.pixels} pixel(s), ${result.pages} page(s).`,
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to re-sync");
      }
    } finally {
      setIsResyncing(false);
    }
  };

  const handleRemove = async (assetId: Id<"metaAssets">) => {
    try {
      await removeAsset({ assetId });
      toast.success("Asset removed");
    } catch {
      toast.error("Failed to remove asset");
    }
  };

  const handleAddAsset = async (type: "ad_account" | "pixel" | "page" | "instagram", metaId: string, name: string) => {
    try {
      await addAsset({ type, metaId, name });
      toast.success("Asset added");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to add asset");
      }
    }
  };

  const hasAnyAssets = assets.all.length > 0;

  // Show the credentials form automatically if no credentials are saved yet
  const shouldShowCredentialsForm =
    isAdmin && (!hasCredentials || showCredentialsForm);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meta Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isConnected
              ? "Your Facebook ad accounts, pixels, and pages are synced."
              : hasCredentials
                ? "Sign in with Facebook to pull everything automatically."
                : "Set up your Meta App credentials, then sync with Facebook."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {isConnected && hasAnyAssets && (
              <Button
                onClick={() => runHealthCheck(false)}
                disabled={isCheckingHealth}
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                <Activity className={`w-4 h-4 mr-1.5 ${isCheckingHealth ? "animate-pulse" : ""}`} />
                {isCheckingHealth ? "Checking..." : "Refresh Status"}
              </Button>
            )}
            {hasCredentials && (
              <Button
                onClick={() => setShowCredentialsForm((p) => !p)}
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Settings
              </Button>
            )}
            {isConnected && (
              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
                size="sm"
                className="cursor-pointer"
              >
                <Unlink className="w-4 h-4 mr-1.5" />
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            )}
            {isConnected ? (
              <Button
                onClick={handleResync}
                disabled={isResyncing}
                className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResyncing ? "animate-spin" : ""}`} />
                {isResyncing ? "Syncing..." : "Re-sync"}
              </Button>
            ) : (
              <Button
                onClick={handleSyncWithFacebook}
                disabled={isConnecting}
                className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {isConnecting ? "Connecting..." : "Sync with Facebook"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Meta App Credentials setup — shown if no creds yet or if user clicks Settings */}
      {shouldShowCredentialsForm && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              Meta App Credentials
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Meta App ID and App Secret from{" "}
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1877F2] underline"
            >
              developers.facebook.com
            </a>
            . These are stored securely and used to connect your Facebook
            account.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label htmlFor="meta-app-id">App ID</Label>
              <Input
                id="meta-app-id"
                placeholder="123456789012345"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-app-secret">App Secret</Label>
              <div className="relative">
                <Input
                  id="meta-app-secret"
                  type={showSecret ? "text" : "password"}
                  placeholder={
                    credentialsDisplay?.hasSecret
                      ? "Enter new secret to update"
                      : "abc123def456..."
                  }
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveCredentials}
              disabled={isSavingCreds || !appId.trim() || !appSecret.trim()}
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
              size="sm"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSavingCreds ? "Saving..." : "Save Credentials"}
            </Button>
            {hasCredentials && (
              <Button
                onClick={() => setShowCredentialsForm(false)}
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>
          {credentialsDisplay?.metaAppId && (
            <p className="text-xs text-muted-foreground mt-3">
              Current App ID:{" "}
              <span className="font-mono">
                {credentialsDisplay.metaAppId}
              </span>
              {credentialsDisplay.hasSecret && " (secret saved)"}
            </p>
          )}
        </div>
      )}

      {/* Connected status badge */}
      {isConnected && (
        <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 w-fit">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Connected{" "}
            {connectionStatus?.connectedAt
              ? new Date(connectionStatus.connectedAt).toLocaleDateString()
              : ""}
          </span>
        </div>
      )}

      {/* Manual token input — alternative to OAuth */}
      {isAdmin && !isConnected && (
        <div className="mb-6">
          {!showTokenInput ? (
            <button
              onClick={() => setShowTokenInput(true)}
              className="text-sm text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Or connect with an access token instead
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">
                  Paste Access Token
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Generate a token from{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1877F2] underline"
                >
                  Facebook Graph API Explorer
                </a>
                . Select your app, add permissions (ads_management, ads_read, pages_show_list, pages_read_engagement, business_management), then click "Generate Access Token".
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste your access token here..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  type="password"
                  className="flex-1"
                />
                <Button
                  onClick={handleConnectWithToken}
                  disabled={isConnectingToken || !manualToken.trim()}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
                  size="sm"
                >
                  {isConnectingToken ? "Connecting..." : "Connect"}
                </Button>
                <Button
                  onClick={() => {
                    setShowTokenInput(false);
                    setManualToken("");
                  }}
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasAnyAssets ? (
        <>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Megaphone />
              </EmptyMedia>
              <EmptyTitle>No Meta assets yet</EmptyTitle>
              <EmptyDescription>
                {hasCredentials
                  ? 'Click "Sync with Facebook" above to sign in and automatically pull all your ad accounts, pixels, and pages.'
                  : "Enter your Meta App credentials above, then sync with Facebook to pull everything automatically."}
              </EmptyDescription>
            </EmptyHeader>
            {hasCredentials && !isConnected && (
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={handleSyncWithFacebook}
                  disabled={isConnecting}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  {isConnecting ? "Connecting..." : "Sync with Facebook"}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </>
      ) : (
        <div className="space-y-10">

          {/* Global asset pool */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Asset Pool
            </h2>
            <GlobalAssetPool
              assets={assets.all}
              onRemove={handleRemove}
              onAdd={handleAddAsset}
            />
          </section>

          {/* Meta Pixel CAPI toggle */}
          {isAdmin && (
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Meta Pixel CAPI
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send conversion events (purchases) to Meta via the Conversions API when donations are completed.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={connectionStatus?.capiEnabled ?? false}
                  onCheckedChange={async (checked) => {
                    try {
                      await toggleCapi({ enabled: checked });
                      toast.success(checked ? "CAPI integration enabled" : "CAPI integration disabled");
                    } catch {
                      toast.error("Failed to update CAPI setting");
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>
              {(connectionStatus?.capiEnabled ?? false) && (
                <CapiEventToggles enabledEvents={connectionStatus?.enabledCapiEvents ?? []} />
              )}
            </section>
          )}

          {/* Test Events — validate CAPI setup without counting live conversions */}
          {isAdmin && (
            <TestEventsPanel
              pixels={assets.pixels.map((p) => ({
                metaId: p.metaId,
                name: p.name,
              }))}
              savedCode={connectionStatus?.testEventCode ?? null}
            />
          )}

          {/* CAPI Event Log */}
          {isAdmin && (
            <CapiEventLog />
          )}


        </div>
      )}
    </div>
  );
}
