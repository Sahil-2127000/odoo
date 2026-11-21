import Modal from './Modal'
import Button from './Button'

/**
 * "Are you sure?" pop-up.
 *   <ConfirmDialog
 *     open={open}
 *     title="Delete product?"
 *     message="This cannot be undone."
 *     confirmText="Delete"
 *     onConfirm={handleDelete}
 *     onClose={() => setOpen(false)}
 *   />
 */
export default function ConfirmDialog({ open, title, message, confirmText = 'Yes, continue', danger = true, loading, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}
