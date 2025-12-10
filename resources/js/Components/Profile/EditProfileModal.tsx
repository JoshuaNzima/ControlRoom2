import React from 'react';
import Modal from '@/Components/Modal';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';

interface Props {
  show: boolean;
  onClose: () => void;
  mustVerifyEmail?: boolean;
  status?: string;
}

export default function EditProfileModal({ show, onClose, mustVerifyEmail = false, status }: Props) {
  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Update your account details.</p>
        </div>
        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
      </div>
    </Modal>
  );
}
