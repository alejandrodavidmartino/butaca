import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

// Hook genérico para cargar datos: devuelve { data, loading, error }
// deps: cuando cambian, se vuelve a pedir
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false; // evita actualizar si el componente ya no está en pantalla
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ data: null, loading: false, error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
