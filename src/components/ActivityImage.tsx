import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ExternalLink, ImageOff } from 'lucide-react';
import { extractDriveFileId, getGoogleDriveViewUrl } from '../services/appsScriptService';

interface ActivityImageProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  originalUrl?: string;
  showOpenButton?: boolean;
  aspectRatioClass?: string;
  fallbackTitle?: string;
  onClick?: () => void;
}

// Global cache for images that have already loaded successfully in this session
const loadedImageCache = new Set<string>();

export const ActivityImage: React.FC<ActivityImageProps> = ({
  src,
  alt = 'ภาพถ่ายกิจกรรม',
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden bg-slate-900',
  originalUrl,
  showOpenButton = false,
  fallbackTitle = 'โรงเรียนพังโคนวิทยาคม',
  onClick,
}) => {
  const target = (src || originalUrl || '').trim();
  const isAlreadyLoaded = loadedImageCache.has(target);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [candidates, setCandidates] = useState<string[]>(() => {
    if (!target) return [];
    if (target.startsWith('data:') || target.startsWith('blob:')) return [target];
    const driveId = extractDriveFileId(target);
    if (driveId) {
      return [
        `https://lh3.googleusercontent.com/d/${driveId}=w1000`,
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
        `https://drive.google.com/uc?export=view&id=${driveId}`,
      ];
    }
    return [target];
  });

  const [isLoading, setIsLoading] = useState(!isAlreadyLoaded && !!target);
  const [hasError, setHasError] = useState(false);
  const prevTargetRef = useRef<string>(target);

  // Compute waterfall URL candidates only when target string actually changes
  useEffect(() => {
    if (prevTargetRef.current === target && candidates.length > 0) {
      return;
    }
    prevTargetRef.current = target;

    if (!target) {
      setCandidates([]);
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // If it's a data URL or blob URL (client upload preview)
    if (target.startsWith('data:') || target.startsWith('blob:')) {
      setCandidates([target]);
      setCandidateIndex(0);
      setIsLoading(!loadedImageCache.has(target));
      setHasError(false);
      return;
    }

    const driveId = extractDriveFileId(target);
    if (driveId) {
      const list: string[] = [
        `https://lh3.googleusercontent.com/d/${driveId}=w1000`,
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
        `https://drive.google.com/uc?export=view&id=${driveId}`,
      ];
      if (target.startsWith('http') && !list.includes(target) && !target.includes('/view')) {
        list.push(target);
      }
      setCandidates(list);
      setCandidateIndex(0);
      setIsLoading(!loadedImageCache.has(list[0]));
      setHasError(false);
    } else if (target.startsWith('http')) {
      setCandidates([target]);
      setCandidateIndex(0);
      setIsLoading(!loadedImageCache.has(target));
      setHasError(false);
    } else {
      setCandidates([]);
      setIsLoading(false);
      setHasError(true);
    }
  }, [target]);

  const currentUrl = candidates[candidateIndex];

  const handleImageError = () => {
    // Advance to next candidate if available, otherwise mark as error
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    if (target) loadedImageCache.add(target);
    if (currentUrl) loadedImageCache.add(currentUrl);
    setIsLoading(false);
    setHasError(false);
  };

  const driveViewUrl = getGoogleDriveViewUrl(originalUrl || src);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Subtle non-blocking spinner: never use an opaque white background */}
      {isLoading && currentUrl && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-6 h-6 rounded-full border-2 border-slate-600/40 border-t-blue-400 animate-spin" />
        </div>
      )}

      {/* Render Image when candidate URL is available */}
      {currentUrl && !hasError ? (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-200`}
        />
      ) : (
        /* Fallback placeholder when no photo exists or image failed */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-400 p-4 select-none">
          {hasError && currentUrl ? (
            <ImageOff className="w-8 h-8 text-slate-500 mb-1" />
          ) : (
            <Trophy className="w-8 h-8 text-slate-500 mb-1" />
          )}
          <span className="text-xs text-slate-400 font-medium text-center">
            {fallbackTitle}
          </span>
          {driveViewUrl && (
            <a
              href={driveViewUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-300 bg-blue-950/80 hover:bg-blue-900 rounded-md border border-blue-700/60 transition-colors"
            >
              <span>เปิดดูภาพใน Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Optional Top overlay button to open in Drive */}
      {showOpenButton && driveViewUrl && (
        <a
          href={driveViewUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium rounded-md backdrop-blur-xs shadow-md transition-all border border-white/20"
          title="เปิดดูภาพต้นฉบับใน Google Drive"
        >
          <span>เปิดภาพใน Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
