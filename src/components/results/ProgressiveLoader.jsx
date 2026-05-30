import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import loadingGif from '../../assets/loading_state/loading.gif';
import loadingImage1 from '../../assets/loading_state/loading_1.jpeg';
import loadingImage2 from '../../assets/loading_state/loading_2.jpeg';
import loadingImage3 from '../../assets/loading_state/loading_3.jpeg';
import loadingImage4 from '../../assets/loading_state/loading_4.jpeg';
import terraLogo from '../../assets/front_page/terra_logo.png';

const LOADING_SEQUENCE = [
  {
    image: loadingImage1,
    message: 'Finding Terrain Overlays...',
  },
  {
    image: loadingImage2,
    message: 'Looking at Road Proximity...',
  },
  {
    image: loadingImage3,
    message: 'Mapping Water and Drainage Paths...',
  },
  {
    image: loadingImage4,
    message: 'Calculating Risk Layers in Real Time...',
  },
];

function LoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) => (current + 1) % LOADING_SEQUENCE.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="progressive-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden bg-white"
    >
      <img
        src={terraLogo}
        alt="Terra"
        className="absolute right-6 top-6 h-10 w-auto"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-start px-6 pb-10 pt-16 sm:px-10 sm:pt-20">
        <div className="flex w-full flex-col items-center gap-6 text-center">
          <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Analyzing Your Land, Hang Tight, don&apos;t go anywhere...
          </h1>

          <img
            src={loadingGif}
            alt="Loading animation"
            className="block w-full max-w-2xl select-none object-contain"
            draggable="false"
          />

          <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] px-2 py-6 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.img
                key={stepIndex}
                src={LOADING_SEQUENCE[stepIndex].image}
                alt={`Loading step ${stepIndex + 1}`}
                initial={{ opacity: 0, scale: 0.985, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mx-auto block w-full max-w-3xl select-none object-contain"
                draggable="false"
              />
            </AnimatePresence>
          </div>

          <div className="flex min-h-[72px] items-center justify-center px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-lg font-semibold tracking-wide text-emerald-700 sm:text-2xl"
              >
                {LOADING_SEQUENCE[stepIndex].message}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ProgressiveLoader — full-screen overlay that cycles through
 * the loading artwork while the Flask engine runs.
 * Renders only when engineState.status === 'loading'.
 */
export default function ProgressiveLoader() {
  const { engineState } = useTerraStore();

  return (
    <AnimatePresence>
      {engineState.status === 'loading' && <LoadingOverlay />}
    </AnimatePresence>
  );
}
