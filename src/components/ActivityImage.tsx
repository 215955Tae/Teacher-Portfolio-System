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
  containerClassName = 'relative w-full h-full overflow-hidden bg-slate-100',
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
  const candidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Automatic timeout for slow network / stuck Google Drive thumbnails (max 3.5s per candidate)
  useEffect(() => {
    if (candidateTimeoutRef.current) {
      clearTimeout(candidateTimeoutRef.current);
    }

    if (isLoading && currentUrl && !hasError && !loadedImageCache.has(currentUrl)) {
      candidateTimeoutRef.current = setTimeout(() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((prev) => prev + 1);
        } else {
          setIsLoading(false);
          setHasError(true);
        }
      }, 3500);
    }

    return () => {
      if (candidateTimeoutRef.current) {
        clearTimeout(candidateTimeoutRef.current);
      }
    };
  }, [candidateIndex, currentUrl, isLoading, hasError, candidates.length]);

  const handleImageError = () => {
    if (candidateTimeoutRef.current) {
      clearTimeout(candidateTimeoutRef.current);
    }
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    if (candidateTimeoutRef.current) {
      clearTimeout(candidateTimeoutRef.current);
    }
    if (target) loadedImageCache.add(target);
    if (currentUrl) loadedImageCache.add(currentUrl);
    setIsLoading(false);
    setHasError(false);
  };

  const driveViewUrl = getGoogleDriveViewUrl(originalUrl || src);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Non-flickering background placeholder */}
      {isLoading && currentUrl && !hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10 transition-opacity duration-300">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
        </div>
      )}

      {/* Render Image when candidate URL is available */}
      {currentUrl && !hasError ? (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        /* Fallback placeholder when no photo exists or image failed */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 text-slate-400 p-4 select-none">
          {hasError && currentUrl ? (
            <ImageOff className="w-9 h-9 text-slate-300 mb-1" />
          ) : (
            <Trophy className="w-9 h-9 text-slate-300 mb-1" />
          )}
          <span className="text-xs text-slate-400 font-medium text-center">
            {fallbackTitle}
          </span>
          {hasError && driveViewUrl && (
            <a
              href={driveViewUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            >
              <span>เปิดดูภาพใน Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Optional Top/Bottom overlay button to open in Drive */}
      {showOpenButton && driveViewUrl && (
        <a
          href={driveViewUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 px-2 py-1 bg-black/60 hover:bg-black/80 text-white text-[10px] font-medium rounded-md backdrop-blur-xs shadow-md transition-all"
          title="เปิดดูภาพต้นฉบับใน Google Drive"
        >
          <span>เปิดภาพใน Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
