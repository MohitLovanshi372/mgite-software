/**
 * GLBStudioPage
 *
 * Dedicated JARVIS 3D Avatar Studio & Model Inspector:
 * - Systematic, clean HUD architecture
 * - Center 3D Viewport with prominent full-body avatar focus
 * - Left control sidebar, right intelligence telemetry, bottom animation timeline
 * - Picture-in-picture floating webcam with live skeletal tracking
 */

import React from 'react';
import { GLBModelViewer } from '../components/GLB/GLBModelViewer.tsx';

export const GLBStudioPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#030408] overflow-hidden select-none">
      <GLBModelViewer className="h-full w-full border-0" />
    </div>
  );
};

