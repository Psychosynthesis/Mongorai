import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import { createWrapperAndAppendToBody } from '@toolz';

import './style.scss';

import type { FullscreenLayerProps }  from './types';

export const FullscreenLayer: React.FC<FullscreenLayerProps> = ({
  children, show, onClick, backgroundColor, className
}) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const cls = clsx({ 'fullscreen-layer-container': true, [className!]: className});

  const wrappedModal = show &&
    <div className={cls} style={{ background: backgroundColor }} onClick={onClick}>
      {children}
    </div>;

  useEffect(() => {
    let container = document.getElementById('fullscreen-modal-root');
    if (!container) container = createWrapperAndAppendToBody('div', 'fullscreen-modal-root');
    setModalRoot(container);
  }, []);

  if (modalRoot === null) return <></>;

  return createPortal(wrappedModal, modalRoot);
}
