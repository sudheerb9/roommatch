// Page-level container for HomeRedirect view state and user interactions.
import { Navigate } from 'react-router-dom';

export default function HomeRedirect() {
  return <Navigate to="/profile" replace />;
}
