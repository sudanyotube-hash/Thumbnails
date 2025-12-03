import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SongDetails, DesignConfig, BackgroundState } from '../types';

interface CanvasEditorProps {
  details: SongDetails;
  config: DesignConfig;
  background: BackgroundState;
}

export interface CanvasEditorHandle {
  download: () => void;
}

const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(({ details, config, background }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Expose download method to parent
  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        // Clean filename
        const safeName = details.songName.replace(/[^a-z0-9\u0600-\u06FF]/gi, '_').substring(0, 20) || 'thumbnail';
        link.download = `${safeName}_thumbnail.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set Dimensions (YouTube recommended)
    canvas.width = 1280;
    canvas.height = 720;

    // 1. Draw Background
    if (background.type === 'solid') {
      ctx.fillStyle = background.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawOverlayAndText(ctx, canvas);
    } else {
      const img = new Image();
      // Handle cross-origin if needed (though generated base64 doesn't need it)
      img.crossOrigin = "anonymous";
      img.src = background.value;
      img.onload = () => {
        // Cover fit
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        drawOverlayAndText(ctx, canvas);
      };
      img.onerror = () => {
        // Fallback if image fails
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawOverlayAndText(ctx, canvas);
      }
    }

  }, [details, config, background]);

  const drawOverlayAndText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;

    // 2. Draw Overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${config.overlayOpacity})`;
    ctx.fillRect(0, 0, width, height);

    // 3. Configure Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl'; // Crucial for Arabic
    ctx.fillStyle = '#ffffff';

    const centerX = width / 2;
    const centerY = height / 2;

    // Font Loading Check (simple)
    // We assume fonts are loaded in CSS, but canvas needs the font string
    const titleFont = `900 120px "${config.fontFamily}"`;
    const artistFont = `700 60px "${config.fontFamily}"`;
    const creditFont = `400 36px "${config.fontFamily}"`;

    if (config.template === 'center-classic') {
      // Song Title
      ctx.font = titleFont;
      // Add shadow for better readability
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 20;
      ctx.fillText(details.songName || 'اسم الأغنية', centerX, centerY - 20);

      // Artist Name
      ctx.font = artistFont;
      ctx.fillStyle = config.primaryColor;
      ctx.shadowBlur = 10;
      ctx.fillText(details.artistName || 'اسم الفنان', centerX, centerY - 120);

      // Credits (Bottom)
      ctx.font = creditFont;
      ctx.fillStyle = '#cccccc';
      ctx.shadowBlur = 4;
      ctx.fillText(details.credits || '', centerX, height - 60);

    } else if (config.template === 'modern-split') {
        // Decorative Line
        ctx.beginPath();
        ctx.strokeStyle = config.primaryColor;
        ctx.lineWidth = 10;
        ctx.moveTo(centerX - 100, centerY + 60);
        ctx.lineTo(centerX + 100, centerY + 60);
        ctx.stroke();

        // Song Title
        ctx.font = titleFont;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 20;
        ctx.fillText(details.songName || 'اسم الأغنية', centerX, centerY);

        // Artist Name
        ctx.font = artistFont;
        ctx.fillText(details.artistName || 'اسم الفنان', centerX, centerY - 100);

         // Credits
        ctx.font = creditFont;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(details.credits || '', centerX, centerY + 120);

    } else if (config.template === 'minimal-bottom') {
        ctx.textAlign = 'right';
        const rightMargin = width - 80;
        const bottomMargin = height - 80;

        // Song Title
        ctx.font = `900 100px "${config.fontFamily}"`;
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(details.songName || 'اسم الأغنية', rightMargin, bottomMargin - 100);

        // Artist Name
        ctx.font = `700 50px "${config.fontFamily}"`;
        ctx.fillStyle = config.primaryColor;
        ctx.fillText(details.artistName || 'اسم الفنان', rightMargin, bottomMargin - 190);

        // Credits (Top Left for balance)
        ctx.textAlign = 'left';
        ctx.font = creditFont;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(details.credits || '', 80, 80);
    }
  };

  return (
    <div className="w-full aspect-video shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-black">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
      />
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
