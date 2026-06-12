import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { useState, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  Camera,
  User,
  Bitcoin,
  Wallet,
  Mail,
  Save,
  Loader2,
  Upload,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

export default function ProfilePage() {
  const profile = useQuery(api.profile.getMyProfile);
  const { isAdmin } = useUserRole();

  if (profile === undefined) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
      <AvatarSection avatarUrl={profile.avatarUrl} name={profile.name} />
      <PersonalInfoSection
        name={profile.name}
        email={profile.email}
      />
      {!isAdmin && (
        <PayoutSection
          bitcoinAddress={profile.bitcoinAddress}
          usdtTrc20Address={profile.usdtTrc20Address}
        />
      )}
    </div>
  );
}

function AvatarSection({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Card>
        <CardContent className="pt-6 flex items-center gap-6">
          <div className="relative group">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-[#1B4332]/10",
                avatarUrl ? "" : "bg-[#1B4332] text-white",
              )}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials || <User className="w-8 h-8" />
              )}
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-lg">{name || "No name set"}</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-sm text-primary hover:underline cursor-pointer font-medium"
            >
              Change profile picture
            </button>
          </div>
        </CardContent>
      </Card>

      <AvatarUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentAvatarUrl={avatarUrl}
        name={name}
        initials={initials}
      />
    </>
  );
}

function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  name,
  initials,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  name: string;
  initials: string;
}) {
  const generateUploadUrl = useMutation(api.profile.generateAvatarUploadUrl);
  const updateProfile = useMutation(api.profile.updateMyProfile);
  const removeAvatar = useMutation(api.profile.removeAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  function resetState() {
    setPreview(null);
    setSelectedFile(null);
    setDragging(false);
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();
      await updateProfile({ avatarStorageId: storageId });
      toast.success("Profile picture updated");
      resetState();
      onOpenChange(false);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeAvatar();
      toast.success("Profile picture removed");
      resetState();
      onOpenChange(false);
    } catch {
      toast.error("Failed to remove profile picture");
    } finally {
      setRemoving(false);
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current / Preview display */}
          <div className="flex justify-center">
            <div
              className={cn(
                "w-28 h-28 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden ring-2 ring-[#1B4332]/10",
                !preview && !currentAvatarUrl ? "bg-[#1B4332] text-white" : "",
              )}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials || <User className="w-10 h-10" />
              )}
            </div>
          </div>

          {/* Drop zone */}
          {!preview && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                dragging
                  ? "border-[#1B4332] bg-[#1B4332]/5"
                  : "border-border hover:border-[#1B4332]/40 hover:bg-accent",
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {dragging ? "Drop image here" : "Drag and drop or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5 MB.</p>
              </div>
            </div>
          )}

          {/* Preview selected file */}
          {preview && (
            <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">
                  {selectedFile?.name}
                </span>
              </div>
              <button
                onClick={() => {
                  resetState();
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {currentAvatarUrl && !preview && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="w-full sm:w-auto"
            >
              {removing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove Picture
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <DialogClose asChild>
              <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                Cancel
              </Button>
            </DialogClose>
            {preview && (
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 sm:flex-none"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonalInfoSection({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const updateProfile = useMutation(api.profile.updateMyProfile);
  const requestEmailChange = useMutation(api.emailChange.requestEmailChange);
  const confirmEmailChange = useMutation(api.emailChange.confirmEmailChange);

  const [editName, setEditName] = useState(name);
  const [saving, setSaving] = useState(false);

  // Email change state
  const [emailStep, setEmailStep] = useState<"view" | "enter_email" | "enter_code">("view");
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  async function handleSave() {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: editName.trim() });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendCode() {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmailLoading(true);
    try {
      await requestEmailChange({ newEmail: newEmail.trim() });
      toast.success("Verification code sent! Check your new email inbox.");
      setEmailStep("enter_code");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to send verification code");
      }
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setEmailLoading(true);
    try {
      await confirmEmailChange({ code: verificationCode.trim() });
      toast.success("Email updated successfully!");
      setEmailStep("view");
      setNewEmail("");
      setVerificationCode("");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to verify code");
      }
    } finally {
      setEmailLoading(false);
    }
  }

  function cancelEmailChange() {
    setEmailStep("view");
    setNewEmail("");
    setVerificationCode("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="w-4 h-4" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your full name"
            />
            <Button
              onClick={handleSave}
              disabled={saving || editName === name}
              size="sm"
              className="shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email" className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            Email
          </Label>

          {emailStep === "view" && (
            <>
              <div className="flex gap-2">
                <Input
                  id="profile-email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <Button
                  size="sm"
                  className="shrink-0 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  onClick={() => setEmailStep("enter_email")}
                >
                  Change
                </Button>
              </div>
            </>
          )}

          {emailStep === "enter_email" && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Enter your new email address. We'll send a verification code to confirm it.
              </p>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                type="email"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  onClick={handleSendCode}
                  disabled={emailLoading || !newEmail.trim()}
                >
                  {emailLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Mail className="w-4 h-4 mr-1.5" />}
                  Send Code
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEmailChange}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {emailStep === "enter_code" && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to <strong className="text-foreground">{newEmail}</strong>. Enter it below.
              </p>
              <Input
                value={verificationCode}
                onChange={(e) => {
                  // Only allow digits, max 6
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(val);
                }}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-[0.3em] font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  onClick={handleVerifyCode}
                  disabled={emailLoading || verificationCode.length !== 6}
                >
                  {emailLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Verify & Update
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVerificationCode("");
                    setEmailStep("enter_email");
                  }}
                  className="cursor-pointer"
                >
                  Try different email
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Code expires in 10 minutes.{" "}
                <button
                  onClick={handleSendCode}
                  disabled={emailLoading}
                  className="underline hover:text-foreground cursor-pointer"
                >
                  Resend code
                </button>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PayoutSection({
  bitcoinAddress,
  usdtTrc20Address,
}: {
  bitcoinAddress: string;
  usdtTrc20Address: string;
}) {
  const updateProfile = useMutation(api.profile.updateMyProfile);
  const [btc, setBtc] = useState(bitcoinAddress);
  const [usdt, setUsdt] = useState(usdtTrc20Address);
  const [saving, setSaving] = useState(false);

  const hasChanges = btc !== bitcoinAddress || usdt !== usdtTrc20Address;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        bitcoinAddress: btc.trim(),
        usdtTrc20Address: usdt.trim(),
      });
      toast.success("Payout details updated");
    } catch {
      toast.error("Failed to update payout details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="w-4 h-4" />
          Payout Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="btc-address" className="flex items-center gap-2">
            <Bitcoin className="w-3.5 h-3.5" />
            Bitcoin Address
          </Label>
          <Input
            id="btc-address"
            value={btc}
            onChange={(e) => setBtc(e.target.value)}
            placeholder="Enter your Bitcoin address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usdt-address" className="flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" />
            USDT (TRC20) Address
          </Label>
          <Input
            id="usdt-address"
            value={usdt}
            onChange={(e) => setUsdt(e.target.value)}
            placeholder="Enter your USDT TRC20 address"
          />
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Payout Details
        </Button>
      </CardContent>
    </Card>
  );
}
