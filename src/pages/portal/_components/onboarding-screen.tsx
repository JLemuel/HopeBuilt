import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import {
  Bitcoin,
  Wallet,
  ArrowRight,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { motion } from "motion/react";

export default function OnboardingScreen() {
  const completeOnboarding = useMutation(api.profile.completeOnboarding);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bitcoinAddress: btcAddress.trim() || undefined,
        usdtTrc20Address: usdtAddress.trim() || undefined,
      });
      toast.success("Welcome aboard! You're all set.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-12 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Header card */}
        <div className="rounded-2xl bg-[#1B4332] p-8 text-white text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5"
          >
            <PartyPopper className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-2xl font-bold mb-2"
          >
            Welcome to HopeBuilt!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-white/80 text-sm leading-relaxed"
          >
            {"We're excited to have you on the team. Let's get your profile set up so we know who you are and where to send your earnings."}
          </motion.p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl bg-card border border-border p-6 space-y-5"
        >
          {/* Name section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Your Name
            </h2>
            <p className="text-sm text-muted-foreground">
              Tell us your name so the team knows who you are.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="onboard-first" className="text-foreground">
                First Name
              </Label>
              <Input
                id="onboard-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="James"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-last" className="text-foreground">
                Last Name
              </Label>
              <Input
                id="onboard-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Wallet section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Payout Wallet Addresses
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your crypto wallet addresses below. You can update these anytime from your profile.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="onboard-btc"
                className="flex items-center gap-2 text-foreground"
              >
                <Bitcoin className="w-4 h-4 text-amber-600" />
                Bitcoin (BTC) Address
              </Label>
              <Input
                id="onboard-btc"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                placeholder="e.g. bc1qxy2kgdygjrsqtzq2n0yrf..."
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="onboard-usdt"
                className="flex items-center gap-2 text-foreground"
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                USDT (TRC20) Address
              </Label>
              <Input
                id="onboard-usdt"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="e.g. TN9RRaXkC8bTm7sL3kLf..."
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
              className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-white h-11 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Setting up..." : "Get Started"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Wallet addresses are optional and can be added later from your Profile.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
