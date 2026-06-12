import { useRef, useCallback } from "react";
import { ImagePlus, Video, TrendingUp, Maximize } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import StepProgress from "./step-progress.tsx";
import type { WizardData } from "./types.ts";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

type StepStoryProps = {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
};

export default function StepStory({ data, updateData, onNext, onBack, currentStep, totalSteps }: StepStoryProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ("webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Please upload an image file (PNG, JPG, or WebP).");
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image must be under 5MB.");
        return;
      }

      updateData({
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    },
    [updateData],
  );

  const handleVideoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        toast.error("Please upload a video file (MP4, WebM, or MOV).");
        return;
      }

      if (file.size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 100MB.");
        return;
      }

      updateData({
        videoFile: file,
        videoPreview: URL.createObjectURL(file),
      });
    },
    [updateData],
  );

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#121212] mb-1">Campaign Story</h2>
      <p className="text-sm text-[#525252] mb-4">
        Step {currentStep + 1} of {totalSteps} — Describe your campaign
      </p>
      <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

      <div className="mt-8 space-y-6">
        {/* Description */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-2 block">Campaign Description</label>
          <textarea
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Describe your campaign's mission, who it helps, and how donations will be used..."
            rows={5}
            className="w-full rounded-xl border border-[#c4c4c4] bg-white px-4 py-3 text-sm text-[#374151] placeholder:text-[#737373] resize-none focus:outline-none focus:ring-2 focus:ring-[#3d8d7a]/30 focus:border-[#3d8d7a]"
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-2 block">Campaign Cover Image</label>
          <div
            onClick={() => imageInputRef.current?.click()}
            className="relative border-2 border-dashed rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center overflow-hidden border-[#c4c4c4] hover:border-[#3d8d7a] bg-[#f5f5f5] h-40"
          >
            {data.imagePreview ? (
              <img
                src={data.imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImagePlus className="w-8 h-8 text-[#737373]" />
                <p className="text-sm text-[#525252]">Click to upload or drag and drop</p>
                <p className="text-xs text-[#737373]">PNG, JPG up to 5MB (recommended 1200x630)</p>
              </div>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
          {data.imagePreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateData({ imageFile: null, imagePreview: null });
              }}
              className="mt-2 text-xs text-red-600 hover:underline cursor-pointer"
            >
              Remove image
            </button>
          )}
        </div>

        {/* Campaign Video */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-2 block">Campaign Video</label>

          {/* Encouragement callout */}
          <div className="rounded-xl bg-[#3d8d7a]/10 border border-[#3d8d7a]/40 p-3.5 mb-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3d8d7a]/20 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-[#2d6b5e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#121212]">
                Videos increase campaign success by 29%
              </p>
              <p className="text-xs text-[#525252] mt-0.5">
                Emotional, detailed storytelling videos are encouraged. Show donors the real people and communities behind your cause.
              </p>
            </div>
          </div>

          <div
            onClick={() => videoInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center overflow-hidden bg-[#f5f5f5] hover:border-[#3d8d7a]",
              data.videoPreview ? "border-[#3d8d7a] h-auto" : "border-[#c4c4c4] h-40",
            )}
          >
            {data.videoPreview ? (
              <div className="relative w-full bg-black rounded-xl" onClick={(e) => e.stopPropagation()}>
                <video
                  ref={videoRef}
                  src={data.videoPreview}
                  controls
                  className="w-full block rounded-xl"
                  style={{ objectFit: "contain" }}
                />
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Video className="w-8 h-8 text-[#737373]" />
                <p className="text-sm text-[#525252]">Click to upload a video</p>
                <p className="text-xs text-[#737373]">MP4, WebM, or MOV up to 100MB</p>
              </div>
            )}
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="hidden"
          />
          {data.videoPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateData({ videoFile: null, videoPreview: null });
              }}
              className="mt-2 text-xs text-red-600 hover:underline cursor-pointer"
            >
              Remove video
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-[#c4c4c4] text-[#121212] font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm hover:bg-[#f5f5f5]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
