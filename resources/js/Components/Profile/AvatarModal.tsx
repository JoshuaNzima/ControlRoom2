import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import CameraCapture from '@/Components/CameraCapture';
import { useForm } from '@inertiajs/react';
import SquareCropper, { SquareCropperHandle } from '@/Components/Profile/SquareCropper';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function AvatarModal({ show, onClose }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const cropperRef = React.useRef<SquareCropperHandle | null>(null);
  const { data, setData, post, processing, errors, reset } = useForm<{ avatar: File | null }>({ avatar: null });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setData('avatar', f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const onCapture = (f: File) => {
    setData('avatar', f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!preview || !cropperRef.current) return;
    try {
      const cropped = await cropperRef.current.crop();
      setData('avatar', cropped);
      post(route('profile.avatar'), {
        forceFormData: true,
        onSuccess: () => {
          reset();
          setPreview(null);
          onClose();
        },
      });
    } catch (e) {
      // no-op; could show toast
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Avatar</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Upload a square image (max 4MB). Use file picker or capture from camera.</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm text-gray-900 dark:text-gray-100" />
                {errors?.avatar && (
                  <div className="mt-1 text-xs text-rose-500">{errors.avatar as any}</div>
                )}
              </div>
              <div>
                <CameraCapture onCapture={onCapture} facingMode="user" />
              </div>
            </div>
          </div>

          {preview && (
            <div className="flex flex-col items-center">
              <SquareCropper ref={cropperRef} src={preview} size={256} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { reset(); setPreview(null); onClose(); }} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm">Close</button>
          <button type="button" onClick={save} disabled={!preview || processing} className="px-4 py-2 rounded-md bg-coin-600 hover:bg-coin-700 disabled:opacity-50 text-white text-sm">
            {processing ? 'Saving...' : 'Crop & Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
