import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 180;
const GROUND_Y = 138;
const DINO_X = 60;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 52;
const GRAVITY_PS2 = 2200;
const JUMP_VELOCITY_PS = -740;
const BASE_SPEED = 220;
const SPEED_RAMP = 18;

function drawDino(context, x, y, legFrame, colors) {
  context.fillStyle = colors.dino;
  context.fillRect(x, y + 20, 12, 8);
  context.fillRect(x + 2, y + 28, 8, 5);
  context.fillRect(x + 8, y + 8, 28, 26);
  context.fillRect(x + 24, y + 2, 12, 16);
  context.fillRect(x + 22, y - 4, 24, 20);
  context.fillRect(x + 42, y + 10, 8, 4);
  context.fillStyle = colors.bg;
  context.fillRect(x + 38, y + 1, 6, 6);
  context.fillStyle = colors.dino;
  context.fillRect(x + 40, y + 3, 3, 3);
  context.fillRect(x + 26, y + 28, 8, 5);

  if (legFrame === 0) {
    context.fillRect(x + 12, y + 34, 8, 18);
    context.fillRect(x + 12, y + 50, 12, 3);
    context.fillRect(x + 24, y + 34, 8, 10);
  } else {
    context.fillRect(x + 12, y + 34, 8, 10);
    context.fillRect(x + 24, y + 34, 8, 18);
    context.fillRect(x + 24, y + 50, 12, 3);
  }
}

const CACTUS_VARIANTS = [
  (context, x, y) => {
    context.fillRect(x + 5, y, 10, 50);
    context.fillRect(x, y + 14, 20, 8);
  },
  (context, x, y) => {
    context.fillRect(x + 5, y, 10, 55);
    context.fillRect(x, y + 12, 9, 8);
    context.fillRect(x + 17, y + 5, 9, 45);
    context.fillRect(x + 14, y + 18, 9, 8);
  },
  (context, x, y) => {
    context.fillRect(x + 9, y, 10, 60);
    context.fillRect(x + 1, y + 10, 9, 8);
    context.fillRect(x + 4, y + 14, 14, 5);
    context.fillRect(x + 21, y + 5, 9, 50);
    context.fillRect(x + 15, y + 20, 10, 5);
  },
];

export default function DinoGameOverlay({ message, done, doneMessage, onClose }) {
  const canvasRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    const colors = isDarkMode
      ? {
          bg: '#0f172a',
          ground: '#475569',
          pebble: '#334155',
          cloud: '#1e293b',
          dino: '#94a3b8',
          cactus: '#22c55e',
          text: '#cbd5e1',
          score: '#64748b',
          over: '#f87171',
        }
      : {
          bg: '#f1f5f9',
          ground: '#94a3b8',
          pebble: '#cbd5e1',
          cloud: '#e2e8f0',
          dino: '#1e3a5f',
          cactus: '#16a34a',
          text: '#374151',
          score: '#6b7280',
          over: '#dc2626',
        };

    let raf;
    let alive = true;
    let started = false;
    let dead = false;
    let elapsed = 0;
    let lastTimestamp = null;
    let pebblePhase = 0;
    let dinoY = GROUND_Y - DINO_HEIGHT;
    let dinoVelocityY = 0;
    let onGround = true;
    let cacti = [];
    let nextCactusIn = 0.9;
    const clouds = [{ x: 80, y: 25 }, { x: 250, y: 18 }, { x: 400, y: 30 }];

    const reset = () => {
      elapsed = 0;
      lastTimestamp = null;
      pebblePhase = 0;
      dinoY = GROUND_Y - DINO_HEIGHT;
      dinoVelocityY = 0;
      onGround = true;
      cacti = [];
      nextCactusIn = 0.9;
      dead = false;
      started = true;
    };

    const jump = () => {
      if (dead) {
        reset();
        return;
      }

      if (!started) {
        started = true;
        return;
      }

      if (onGround) {
        dinoVelocityY = JUMP_VELOCITY_PS;
        onGround = false;
      }
    };

    const handleKeyDown = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };
    const handleTouchStart = (event) => {
      event.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    const loop = (timestamp) => {
      if (!alive) return;

      const deltaSeconds = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
      lastTimestamp = timestamp;

      context.fillStyle = colors.bg;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const speed = BASE_SPEED + elapsed * SPEED_RAMP;

      clouds.forEach((cloud) => {
        if (started && !dead) cloud.x -= speed * 0.22 * deltaSeconds;
        if (cloud.x < -60) cloud.x = CANVAS_WIDTH + 50;
        context.fillStyle = colors.cloud;
        context.fillRect(cloud.x, cloud.y, 42, 10);
        context.fillRect(cloud.x + 10, cloud.y - 8, 26, 10);
      });

      context.fillStyle = colors.ground;
      context.fillRect(0, GROUND_Y + 2, CANVAS_WIDTH, 3);

      if (started && !dead) pebblePhase = (pebblePhase + speed * deltaSeconds) % 26;
      context.fillStyle = colors.pebble;
      for (let i = 0; i < 22; i += 1) {
        const pebbleX = ((i * 26 - pebblePhase) % (CANVAS_WIDTH + 26) + CANVAS_WIDTH + 26) % (CANVAS_WIDTH + 26);
        context.fillRect(pebbleX, GROUND_Y + 8, 3, 2);
      }

      if (started && !dead) {
        elapsed += deltaSeconds;
        dinoVelocityY += GRAVITY_PS2 * deltaSeconds;
        dinoY += dinoVelocityY * deltaSeconds;

        if (dinoY >= GROUND_Y - DINO_HEIGHT) {
          dinoY = GROUND_Y - DINO_HEIGHT;
          dinoVelocityY = 0;
          onGround = true;
        }

        nextCactusIn -= deltaSeconds;
        if (nextCactusIn <= 0) {
          const height = 48 + Math.floor(Math.random() * 22);
          cacti.push({
            x: CANVAS_WIDTH + 10,
            y: GROUND_Y - height,
            width: 28,
            height,
            type: Math.floor(Math.random() * CACTUS_VARIANTS.length),
          });
          nextCactusIn = 0.55 + Math.random() * 0.85;
        }

        cacti.forEach((cactus) => {
          cactus.x -= speed * deltaSeconds;
        });
        cacti = cacti.filter((cactus) => cactus.x > -60);

        const collisionMargin = 8;
        for (const cactus of cacti) {
          if (
            DINO_X + collisionMargin < cactus.x + cactus.width - collisionMargin &&
            DINO_X + DINO_WIDTH - collisionMargin > cactus.x + collisionMargin &&
            dinoY + collisionMargin < cactus.y + cactus.height &&
            dinoY + DINO_HEIGHT > cactus.y + collisionMargin
          ) {
            dead = true;
            break;
          }
        }
      }

      cacti.forEach((cactus) => {
        context.fillStyle = colors.cactus;
        CACTUS_VARIANTS[cactus.type](context, cactus.x, cactus.y);
      });

      const legFrame = onGround && started && !dead ? Math.floor(timestamp / 100) % 2 : 0;
      drawDino(context, DINO_X, dinoY, legFrame, colors);

      context.font = 'bold 13px monospace';
      context.fillStyle = colors.score;
      context.textAlign = 'right';
      context.fillText(`Score: ${String(Math.floor(elapsed * 12)).padStart(5, '0')}`, CANVAS_WIDTH - 12, 22);

      if (!started) {
        context.font = '13px monospace';
        context.fillStyle = colors.text;
        context.textAlign = 'center';
        context.fillText('Pulsa ESPACIO o toca para jugar', CANVAS_WIDTH / 2, GROUND_Y - 56);
      }

      if (dead) {
        context.font = 'bold 20px monospace';
        context.fillStyle = colors.over;
        context.textAlign = 'center';
        context.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);
        context.font = '12px monospace';
        context.fillStyle = colors.text;
        context.fillText('ESPACIO o toca para reiniciar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', jump);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isDarkMode]);

  return (
    <div className="safe-area-px safe-area-py fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`flex max-h-full w-[524px] max-w-full flex-col items-center gap-4 overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6 ${
          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
        }`}
      >
        {!done ? (
          <div className="flex items-center gap-3">
            <div
              className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${
                isDarkMode ? 'border-syntix-green' : 'border-syntix-navy'
              }`}
            />
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>
              {message}
            </p>
          </div>
        ) : (
          <div
            className={`flex w-full flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              isDarkMode ? 'border-emerald-800 bg-emerald-950/60' : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle className={`h-5 w-5 shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                {doneMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-syntix-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-syntix-navy/90"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="relative w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ borderRadius: 8, cursor: 'pointer', width: '100%', display: 'block' }}
            className={`border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
          />
        </div>

        <p className={`text-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          {done ? 'Sigue jugando o cierra con el boton de arriba' : 'Juega mientras esperas. ESPACIO o toca para saltar'}
        </p>
      </div>
    </div>
  );
}

DinoGameOverlay.propTypes = {
  message: PropTypes.string,
  done: PropTypes.bool,
  doneMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

DinoGameOverlay.defaultProps = {
  message: 'Procesando...',
  done: false,
  doneMessage: 'Listo.',
};
