import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { cn } from "@/lib/utils.ts";

type ForgotPasswordFormProps = {
  onBack: () => void;
};

type Step = "request" | "verify";

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const { requestPasswordReset, verifyPasswordReset } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setStep("verify");
    } catch (err) {
      setSubmitError((err as Error).message ?? "Could not send reset email");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (newPassword !== confirm) {
      setSubmitError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setSubmitError("Password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyPasswordReset(email.trim(), code.trim(), newPassword);
      navigate("/portal", { replace: true });
    } catch (err) {
      setSubmitError(
        (err as Error).message ?? "Invalid code or password reset failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors";
  const inputNormal =
    "border-gray-200 focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/20";

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below
          along with your new password.
        </p>

        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={cn(inputBase, inputNormal)}
        />

        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="New password (at least 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={cn(inputBase, inputNormal)}
        />

        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={cn(inputBase, inputNormal)}
        />

        {submitError && (
          <p className="text-sm text-red-500" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full h-13 text-base font-semibold bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white rounded-xl transition-colors cursor-pointer",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("request");
            setCode("");
            setNewPassword("");
            setConfirm("");
          }}
          className="text-sm text-[#2d6b5e] hover:underline self-start cursor-pointer"
        >
          ← Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Enter your email and we&apos;ll send you a 6-digit code to reset your
        password.
      </p>

      <input
        type="email"
        required
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(inputBase, inputNormal)}
      />

      {submitError && (
        <p className="text-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full h-13 text-base font-semibold bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white rounded-xl transition-colors cursor-pointer",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {isSubmitting ? "Sending..." : "Send reset code"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[#2d6b5e] hover:underline self-start cursor-pointer"
      >
        ← Back to sign in
      </button>
    </form>
  );
}
