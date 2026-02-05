import { useSessionManagement } from '../hooks/useSessionManagement';
import { SessionWarning } from './SessionWarning';

/**
 * Component that manages session and displays warning
 */
export function SessionManager() {
  const { showWarning, handleStaySignedIn, handleSignOut, handleCloseWarning } = useSessionManagement();

  if (!showWarning) {
    return null;
  }

  return (
    <SessionWarning
      onStaySignedIn={handleStaySignedIn}
      onSignOut={handleSignOut}
      onClose={handleCloseWarning}
    />
  );
}
