import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';

import { chatIcon } from '../icons';

export function buildBigcodeSidebar(): ReactWidget {
  const BigCodeWidget = ReactWidget.create(
    <div>
      <input type="text" placeholder="apikey" />
      <input type="text" placeholder="keydown" />
      <button>save</button>
      <button>turn on/off</button>
    </div>
  );
  console.log('buildBigcodeSidebar');
  BigCodeWidget.id = 'jupyter-ai::bigcode';
  BigCodeWidget.title.icon = chatIcon;
  BigCodeWidget.title.caption = 'bigcode continuation'; // TODO: i18n
  return BigCodeWidget;
}
