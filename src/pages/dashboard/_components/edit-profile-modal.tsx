import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import { ArrowLeft, Camera } from "lucide-react";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "edit" | "verify-email";

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const updateProfile = useMutation(api.donorDashboard.updateDonorProfile);
  const generateUploadUrl = useMutation(api.profile.generateAvatarUploadUrl);
  const requestEmailChange = useMutation(api.emailChange.requestEmailChange);
  const confirmEmailChange = useMutation(api.emailChange.confirmEmailChange);

  const [step, setStep] = useState<Step>("edit");
  const [name, setName] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingStorageId, setPendingStorageId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset transient state whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setStep("edit");
      setName(null);
      setEmailDraft(null);
      setPendingNewEmail(null);
      setCode("");
      setPreviewUrl(null);
      setPendingStorageId(null);
    }
  }, [open]);

  const displayName = name !== null ? name : (currentUser?.name ?? "");
  const displayEmail = emailDraft !== null ? emailDraft : (currentUser?.email ?? "");
  const emailChanged =
    displayEmail.trim().toLowerCase() !==
    (currentUser?.email ?? "").trim().toLowerCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: string };
      setPendingStorageId(storageId);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      toast.error(describeError(err, "Failed to upload photo"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist name/avatar first so they stick immediately, even if the
      // email-change step needs verification.
      const hasNameOrAvatar = name !== null || pendingStorageId !== null;
      if (hasNameOrAvatar) {
        await updateProfile({
          name: displayName || undefined,
          avatarStorageId: pendingStorageId
            ? (pendingStorageId as Parameters<typeof updateProfile>[0]["avatarStorageId"])
            : undefined,
        });
      }

      if (emailChanged) {
        const newEmail = displayEmail.trim();
        await requestEmailChange({ newEmail });
        setPendingNewEmail(newEmail);
        setCode("");
        setStep("verify-email");
        toast.success(`Verification code sent to ${newEmail}`);
        return;
      }

      if (hasNameOrAvatar) {
        toast.success("Profile updated.");
      }
      onClose();
    } catch (err) {
      toast.error(describeError(err, "Failed to save profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    try {
      await confirmEmailChange({ code: trimmed });
      toast.success("Email updated.");
      onClose();
    } catch (err) {
      toast.error(describeError(err, "Could not verify code"));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!pendingNewEmail) return;
    setResending(true);
    try {
      await requestEmailChange({ newEmail: pendingNewEmail });
      toast.success(`New code sent to ${pendingNewEmail}`);
      setCode("");
    } catch (err) {
      toast.error(describeError(err, "Failed to resend code"));
    } finally {
      setResending(false);
    }
  };

  const initials = getInitials(currentUser?.name ?? currentUser?.email ?? "?");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "edit" ? "Edit Profile" : "Verify your email"}
          </DialogTitle>
        </DialogHeader>

        {step === "edit" ? (
          <>
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Avatar */}
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#3d8d7a]/15 text-[#2d6b5e] font-bold text-2xl flex items-center justify-center uppercase">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-foreground text-background rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {uploading ? <Spinner /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="w-full space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="w-full space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={displayEmail}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="you@example.com"
                />
                {emailChanged && (
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send a 6-digit code to confirm.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white"
              >
                {saving ? <Spinner /> : emailChanged ? "Save & verify email" : "Save changes"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{pendingNewEmail}</span>.
                Enter it below to finish changing your email.
              </p>

              <div className="w-full space-y-1.5">
                <Label htmlFor="verify-code">Verification code</Label>
                <Input
                  id="verify-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="tracking-[0.4em] text-center text-lg"
                />
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-[#2d6b5e] hover:text-[#2d6b5e] self-start cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Resending…" : "Resend code"}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep("edit")}
                disabled={verifying}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                className="bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white"
              >
                {verifying ? <Spinner /> : "Verify email"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
