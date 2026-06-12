import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { cn } from "@/lib/utils.ts";

export default function SignupForm() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (password !== confirm) {
      setSubmitError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters");
      return;
    }
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      navigate("/portal", { replace: true });
    } catch (err) {
      setSubmitError((err as Error).message ?? "Could not create account");
    }
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors";
  const inputNormal =
    "border-gray-200 focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/20";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        autoComplete="name"
        placeholder="Full name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn(inputBase, inputNormal)}
      />
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
      <input
        type="password"
        required
        autoComplete="new-password"
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={cn(inputBase, inputNormal)}
      />
      <input
        type="password"
        required
        autoComplete="new-password"
        placeholder="Confirm password"
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
        disabled={isLoading}
        className={cn(
          "w-full h-13 text-base font-semibold bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white rounded-xl transition-colors cursor-pointer",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
