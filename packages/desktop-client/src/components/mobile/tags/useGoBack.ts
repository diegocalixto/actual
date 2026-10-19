import { useNavigate } from '#hooks/useNavigate';

/**
 * Returns to the previous screen, or to `fallback` when the page was opened
 * directly (a reload, a shared link) and there is no in-app entry to return
 * to. React Router numbers its history entries in `history.state.idx`; the
 * first entry of the session is 0.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();

  return () => {
    if (hasInAppHistory()) {
      void navigate(-1);
    } else {
      void navigate(fallback, { replace: true });
    }
  };
}

function hasInAppHistory() {
  const state: unknown = window.history.state;
  return (
    typeof state === 'object' &&
    state !== null &&
    'idx' in state &&
    typeof state.idx === 'number' &&
    state.idx > 0
  );
}
