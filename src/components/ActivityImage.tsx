import React, { useState, useEffect } from 'react';
import { Trophy, ExternalLink, ImageOff, Loader2 } from 'lucide-react';
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
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Compute waterfall URL candidates whenever src or originalUrl changes
  useEffect(() => {
    const raw = (src || '').trim();
    const orig = (originalUrl || '').trim();
    const target = raw || orig;

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
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const driveId = extractDriveFileId(target) || extractDriveFileId(orig);

    if (driveId) {
      // 3 Google CDN/Drive direct thumbnail variations:
      // 1) lh3.googleusercontent.com/d/ID=w1000 (Fastest CDN, no cookies/auth restrictions)
      // 2) drive.google.com/thumbnail?id=ID&sz=w1000 (Official thumbnail endpoint)
      // 3) drive.google.com/uc?export=view&id=ID (Direct download stream)
      const list: string[] = [
        `https://lh3.googleusercontent.com/d/${driveId}=w1000`,
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
        `https://drive.google.com/uc?export=view&id=${driveId}`,
      ];

      // If original target had a different URL, add as last resort
      if (target.startsWith('http') && !list.includes(target) && !target.includes('/view')) {
        list.push(target);
      }

      setCandidates(list);
      setCandidateIndex(0);
      setIsLoading(true);
      setHasError(false);
    } else if (target.startsWith('http')) {
      setCandidates([target]);
      setCandidateIndex(0);
      setIsLoading(true);
      setHasError(false);
    } else {
      setCandidates([]);
      setIsLoading(false);
      setHasError(true);
    }
  }, [src, originalUrl]);

  const currentUrl = candidates[candidateIndex];

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      // Try next alternative source
      setCandidateIndex((prev) => prev + 1);
    } else {
      // All alternatives exhausted
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const driveViewUrl = getGoogleDriveViewUrl(originalUrl || src);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Loading state indicator */}
      {isLoading && currentUrl && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 z-10 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        /* Fallback placeholder when no photo exists or image failed */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 text-slate-400 p-4 select-none">
          {hasError && currentUrl ? (
            <ImageOff className="w-10 h-10 text-slate-300 mb-1" />
          ) : (
            <Trophy className="w-10 h-10 text-slate-300 mb-1" />
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
