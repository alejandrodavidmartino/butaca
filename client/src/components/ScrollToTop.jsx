import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Al ir a otra página, subimos arriba del todo (si no, al pulsar una película
// del final de un carrusel la ficha nueva se abría a mitad de página).
// Con «atrás» (POP) no tocamos nada para que el navegador recupere dónde estabas.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();

  useEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0);
  }, [pathname, type]);

  return null;
}
