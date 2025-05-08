import Image from 'next/image';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, alt = "Image preview" }: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white p-4 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <button
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full aspect-[3/4] rounded overflow-hidden">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 