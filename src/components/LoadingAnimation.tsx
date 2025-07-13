import { Player } from '@lottiefiles/react-lottie-player';
import { useRef } from 'react';
import loadingAnimation from '../../public/loading.json';

interface LoadingAnimationProps {
  className?: string;
}

function LoadingAnimation({ className }: LoadingAnimationProps) {
  const lottieRef = useRef<Player>(null);

  return (
    <Player
      ref={lottieRef}
      autoplay
      loop
      src={loadingAnimation}
      className={`w-[150px] scale-125 ${className || ''}`}
    />
  );
}

export default LoadingAnimation;