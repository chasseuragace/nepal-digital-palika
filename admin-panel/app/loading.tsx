import './loading.css';

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <h2>Loading</h2>
        <p>Hold for a Moment</p>
      </div>
    </div>
  );
}
