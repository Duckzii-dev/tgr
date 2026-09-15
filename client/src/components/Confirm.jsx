import Modal from './Modal.jsx';

export default function Confirm({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  body = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-300">{body}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn bg-red-500 text-white hover:bg-red-600"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}