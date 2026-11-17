import { useEffect, useRef, useState } from "react";
import { useStudio } from "../state/StudioProvider";

export function WebcamModal() {
  const { webcamOpen, setWebcamOpen, setOriginalUrl } = useStudio();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!webcamOpen) return;
    let cancelled = false;
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setError("Camera permission was blocked. Allow the camera and try again.");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [webcamOpen]);

  if (!webcamOpen) return null;

  const close = () => setWebcamOpen(false);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("The camera preview is not ready yet.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setOriginalUrl(canvas.toDataURL("image/png"), "Webcam portrait");
    close();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-primary/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-margin-mobile">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.16)] p-space-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="webcam-title"
      >
        <div className="flex items-start justify-between gap-space-sm mb-space-md">
          <div>
            <h2 id="webcam-title" className="font-headline-sm text-headline-sm text-on-surface">
              Capture Photo
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Live preview from this device. The still is used as the source portrait.
            </p>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors"
            type="button"
            onClick={close}
            aria-label="Close camera"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="relative aspect-[3/4] rounded-DEFAULT bg-surface-container-low overflow-hidden shadow-inner">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        </div>
        {error ? <p className="mt-space-sm font-label-sm text-label-sm text-error">{error}</p> : null}
        <div className="mt-space-md flex flex-col gap-2">
          <button
            className="w-full h-10 px-3 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            type="button"
            onClick={capture}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span>Capture Photo</span>
          </button>
          <button
            className="w-full h-9 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-95 transition-all"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
