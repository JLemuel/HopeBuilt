import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { HandHeart, ShieldCheck } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function GivingGuaranteeDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white text-[#121212] border-[#cfcfcf]">
        <div className="flex flex-col items-center text-center pt-2">
          {/* HopeBuilt logo */}
          <img
            src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
            alt="HopeBuilt"
            className="h-10 mb-6"
          />

          {/* Hugging icon */}
          <div className="w-16 h-16 rounded-full bg-[#3d8d7a]/10 flex items-center justify-center mb-5">
            <HandHeart className="w-8 h-8 text-[#2d6b5e]" />
          </div>

          <DialogHeader className="sm:text-center">
            <DialogTitle className="text-center text-2xl text-[#121212]">
              Give with Confidence.
            </DialogTitle>
            <DialogDescription className="text-center text-[15px] leading-relaxed text-[#333] pt-2">
              We believe kindness should never come with worry. Every donation
              is fully protected for one year, so you can focus on the impact
              you're making {"\u2014"} and leave the rest to us.
            </DialogDescription>
          </DialogHeader>

          {/* Protection highlight */}
          <div className="mt-6 w-full flex items-center gap-3 rounded-lg bg-[#F5F5F5] px-4 py-3 text-left">
            <ShieldCheck className="w-5 h-5 text-[#2d6b5e] shrink-0" />
            <p className="text-sm text-[#121212]">
              <span className="font-semibold">1-year donation protection</span>{" "}
              <span className="text-[#525252]">
                {"\u2014"} full refund if fraud occurs.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center mt-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer w-full sm:w-auto bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
