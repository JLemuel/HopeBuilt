import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { formatCardNumber, formatExpiry } from "../_lib/utils.ts";
import type { CheckoutFormProps } from "./types.ts";

export default function SimulatedForm({
  amount,
  donationType,
  campaignSlug,
}: CheckoutFormProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [useAsBillingName, setUseAsBillingName] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [country, setCountry] = useState("US");
  const [postalCode, setPostalCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anonymousDonation, setAnonymousDonation] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cleanedCardNumber = cardNumber.replace(/\s/g, "");
  const cleanedExpiry = expiry.replace("/", "");

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Valid email is required";
    }
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (cleanedCardNumber.length < 13)
      newErrors.cardNumber = "Valid card number is required";
    if (cleanedExpiry.length < 4) {
      newErrors.expiry = "Valid expiry is required";
    } else {
      const month = parseInt(cleanedExpiry.slice(0, 2), 10);
      if (month < 1 || month > 12) newErrors.expiry = "Invalid month";
    }
    if (cvv.length < 3) newErrors.cvv = "Valid CVV is required";
    if (!useAsBillingName && !nameOnCard.trim())
      newErrors.nameOnCard = "Name on card is required";
    if (!postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const params = new URLSearchParams({
      amount: amount.toString(),
      type: donationType,
      name: `${firstName} ${lastName}`.trim(),
      email: email.trim(),
    });
    if (campaignSlug) params.set("campaign", campaignSlug);
    window.location.href = `/thank-you?${params.toString()}`;
  }

  const inputBase =
    "w-full rounded-lg border bg-white px-4 py-3.5 text-[15px] text-[#121212] placeholder:text-[#9e9e9e] outline-none transition-colors";
  const inputNormal =
    "border-[#c4c4c4] focus:border-[#3d8d7a] focus:ring-1 focus:ring-[#3d8d7a]/30";
  const inputError =
    "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* ---- Contact section ---- */}
      <p className="text-[14px] font-semibold text-[#121212] mb-3">Contact</p>

      {/* Email */}
      <div className="mb-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(inputBase, errors.email ? inputError : inputNormal)}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>
        )}
      </div>

      {/* First name */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={cn(
            inputBase,
            errors.firstName ? inputError : inputNormal,
          )}
        />
        {errors.firstName && (
          <p className="text-xs text-red-500 mt-1 ml-1">
            {errors.firstName}
          </p>
        )}
      </div>

      {/* Last name */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={cn(
            inputBase,
            errors.lastName ? inputError : inputNormal,
          )}
        />
        {errors.lastName && (
          <p className="text-xs text-red-500 mt-1 ml-1">
            {errors.lastName}
          </p>
        )}
      </div>

      {/* Use as billing name */}
      <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={useAsBillingName}
          onChange={(e) => setUseAsBillingName(e.target.checked)}
          className={cn(
            "appearance-none w-4.5 h-4.5 rounded-md border border-[#c4c4c4] bg-white cursor-pointer shrink-0",
            "checked:bg-[#3d8d7a] checked:border-[#3d8d7a] relative",
            "checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45",
          )}
        />
        <span className="text-[14px] text-[#505050]">
          Use as billing name
        </span>
      </label>

      {/* ---- Payment method label ---- */}
      <p className="text-[14px] font-semibold text-[#121212] mb-3">Payment</p>

      {/* Card number */}
      <div className="mb-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Card number"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          className={cn(
            inputBase,
            errors.cardNumber ? inputError : inputNormal,
          )}
        />
        {errors.cardNumber && (
          <p className="text-xs text-red-500 mt-1 ml-1">
            {errors.cardNumber}
          </p>
        )}
      </div>

      {/* Expiry / CVV */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            className={cn(
              inputBase,
              errors.expiry ? inputError : inputNormal,
            )}
          />
          {errors.expiry && (
            <p className="text-xs text-red-500 mt-1 ml-1">
              {errors.expiry}
            </p>
          )}
        </div>
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="CVV"
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            maxLength={4}
            className={cn(inputBase, errors.cvv ? inputError : inputNormal)}
          />
          {errors.cvv && (
            <p className="text-xs text-red-500 mt-1 ml-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Name on card */}
      {!useAsBillingName && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Name on card"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            className={cn(
              inputBase,
              errors.nameOnCard ? inputError : inputNormal,
            )}
          />
          {errors.nameOnCard && (
            <p className="text-xs text-red-500 mt-1 ml-1">
              {errors.nameOnCard}
            </p>
          )}
        </div>
      )}

      {/* Country / Postal */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="relative">
          <label className="absolute top-2 left-4 text-[11px] text-[#9e9e9e] font-medium">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={cn(
              inputBase,
              "pt-6 pb-2.5 appearance-none cursor-pointer",
              "border-[#c4c4c4] focus:border-[#3d8d7a]",
            )}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="NL">Netherlands</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="BR">Brazil</option>
            <option value="IN">India</option>
            <option value="JP">Japan</option>
            <option value="MX">Mexico</option>
            <option value="NG">Nigeria</option>
            <option value="ZA">South Africa</option>
            <option value="AE">United Arab Emirates</option>
            <option value="other">Other</option>
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252] pointer-events-none"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <input
            type="text"
            placeholder="Postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className={cn(
              inputBase,
              errors.postalCode ? inputError : inputNormal,
            )}
          />
          {errors.postalCode && (
            <p className="text-xs text-red-500 mt-1 ml-1">
              {errors.postalCode}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full py-4 rounded-lg text-base font-semibold transition-all cursor-pointer",
          "bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "Donate now"
        )}
      </button>

      {/* Don't display name checkbox */}
      <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none justify-center sm:justify-start">
        <input
          type="checkbox"
          checked={anonymousDonation}
          onChange={(e) => setAnonymousDonation(e.target.checked)}
          className={cn(
            "appearance-none w-4.5 h-4.5 rounded-md border border-[#c4c4c4] bg-white cursor-pointer shrink-0",
            "checked:bg-[#3d8d7a] checked:border-[#3d8d7a] relative",
            "checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45",
          )}
        />
        <span className="text-[14px] text-[#505050]">
          {"Don’t display my name publicly."}
        </span>
      </label>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <Lock className="w-3.5 h-3.5 text-[#9e9e9e]" />
        <p className="text-xs text-[#9e9e9e]">
          Your payment info is encrypted and secure
        </p>
      </div>
    </form>
  );
}
