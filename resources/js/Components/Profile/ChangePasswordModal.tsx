import React from 'react';
import Modal from '@/Components/Modal';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ show, onClose }: Props) {
  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Use a long, unique password to keep your account secure.</p>
        </div>
        <UpdatePasswordForm />
      </div>
    </Modal>
  );
}
