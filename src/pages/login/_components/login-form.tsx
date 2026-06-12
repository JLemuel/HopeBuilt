import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { cn } from "@/lib/utils.ts";

type LoginFormProps = {
  onForgotPassword: () => void;
};

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const navigate = useNavigate();
  const { passwordLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    try {
      await passwordLogin(email.trim(), password);
      navigate("/portal", { replace: true });
    } catch (err) {
      setSubmitError(
        (err as Error).message ?? "Invalid email or password",
      );
    }
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-white text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors";
  const inputNormal =
    "border-gray-200 focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/20";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-[#2d6b5e] hover:underline self-end cursor-pointer mt-1"
      >
        Forgot password?
      </button>
    </form>
  );
}
