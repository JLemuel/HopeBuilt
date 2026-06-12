import { forwardRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button, buttonVariants } from "@/components/ui/button.tsx";

export interface SignInButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  asChild?: boolean;
}

/**
 * Sign-in / sign-out button. When the user is unauthenticated it navigates
 * to `/login` (our branded login page). When authenticated it calls
 * `logout()` and sends them home. The component reads `isAuthenticated` /
 * `isLoading` directly from our AuthContext so it stays in sync.
 */
export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      disabled,
      showIcon = true,
      signInText = "Sign In",
      signOutText = "Sign Out",
      loadingText,
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, logout } = useAuth();

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (isAuthenticated) {
          logout();
          navigate("/");
        } else {
          navigate("/login");
        }
      },
      [isAuthenticated, logout, navigate, onClick],
    );

    const isDisabled = disabled || isLoading;
    const defaultLoadingText = isAuthenticated
      ? "Signing Out..."
      : "Signing In...";
    const currentLoadingText = loadingText || defaultLoadingText;

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={className}
        asChild={asChild}
        aria-label={
          isAuthenticated
            ? "Sign out of your account"
            : "Sign in to your account"
        }
        {...props}
      >
        {showIcon && icon}
        {buttonText}
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";
