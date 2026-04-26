// LoadingSpinner — reusable animated loading indicator
interface Props {
  size?: number;
  text?: string;
}

export default function LoadingSpinner({ size = 40, text }: Props) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" style={{ width: size, height: size }}>
        <div className="loading-spinner-ring" />
        <div className="loading-spinner-ring loading-spinner-ring-2" />
        <div className="loading-spinner-core">QF</div>
      </div>
      {text && <p className="loading-spinner-text">{text}</p>}
    </div>
  );
}
