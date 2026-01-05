import './EmptyState.css';

interface EmptyStateProps {
  message: string;
  actionText: string;
  onAction: () => void;
  icon: string;
}

const EmptyState = ({ message, actionText, onAction, icon }: EmptyStateProps) => (
  <div className="empty-state-card">
    <div className="empty-icon">{icon}</div>
    <h3>{message}</h3>
    <button className="empty-action-btn" onClick={onAction}>
      {actionText}
    </button>
  </div>
);

export default EmptyState;