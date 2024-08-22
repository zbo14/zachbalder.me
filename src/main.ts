import './style.css';

const BACKGROUND_WIDTH = 180;
const BACKGROUND_HEIGHT = 160;
const BACKGROUND_MIDPOINT_WIDTH = BACKGROUND_WIDTH / 2;
const BACKGROUND_MIDPOINT_HEIGHT = BACKGROUND_HEIGHT / 2;
const STROKE_WIDTH = 2;

const dialog = document.querySelector('.info-dialog') as any;
const openButton = dialog.nextElementSibling;

openButton.addEventListener('click', () => dialog.show());

const playbackButton = document.getElementById('playback-button');
const waveButtons = document.querySelectorAll('.wave-button');
const volumeFader = document.getElementById('volume-fader') as any;
const speedFader = document.getElementById('speed-fader') as any;
const background = document.getElementById(
  'background'
) as unknown as SVGSVGElement;
const pattern = background.getElementById('pattern');

background.pauseAnimations();

type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth';

let audioContext = new AudioContext();
let gain = audioContext.createGain();

gain.connect(audioContext.destination);
let volume = (gain.gain.value = 0.5);

let isPlaying = false;
let wave: Wave = 'sine';
let source: AudioBufferSourceNode | null = null;
let speed = 1;
let height = volume * BACKGROUND_MIDPOINT_HEIGHT * 0.8;

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    audioContext = new AudioContext();
    gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.value = volume;

    if (source) {
      source.playbackRate.value = speed;
    }
  } else if (isPlaying) {
    onPlayback();
  }
});

const paths = {
  sine() {
    return `M 0 ${BACKGROUND_MIDPOINT_HEIGHT} 
      C ${BACKGROUND_WIDTH / 6} ${BACKGROUND_MIDPOINT_HEIGHT - height}, ${BACKGROUND_WIDTH / 3} ${BACKGROUND_MIDPOINT_HEIGHT - height}, ${BACKGROUND_MIDPOINT_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT} 
      S ${BACKGROUND_WIDTH * 0.8} ${BACKGROUND_MIDPOINT_HEIGHT + height}, ${BACKGROUND_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT}`;
  },

  triangle() {
    return `M 0 ${BACKGROUND_MIDPOINT_HEIGHT} 
      L ${BACKGROUND_WIDTH * 0.25} ${BACKGROUND_MIDPOINT_HEIGHT - height} 
      L ${BACKGROUND_WIDTH * 0.5} ${BACKGROUND_MIDPOINT_HEIGHT}
      L ${BACKGROUND_WIDTH * 0.75} ${BACKGROUND_MIDPOINT_HEIGHT + height}
      L ${BACKGROUND_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT}`;
  },

  square() {
    return `M 0 ${BACKGROUND_MIDPOINT_HEIGHT} 
      L ${STROKE_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT - height} 
      L ${BACKGROUND_MIDPOINT_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT - height} 
      L ${BACKGROUND_MIDPOINT_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT + height} 
      L ${BACKGROUND_WIDTH - STROKE_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT + height} 
      L ${BACKGROUND_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT}`;
  },

  sawtooth() {
    return `M 0 ${BACKGROUND_MIDPOINT_HEIGHT} 
      L ${BACKGROUND_MIDPOINT_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT - height} 
      L ${BACKGROUND_MIDPOINT_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT + height} 
      L ${BACKGROUND_WIDTH} ${BACKGROUND_MIDPOINT_HEIGHT}`;
  },
};

setBackgroundPattern();

function setBackgroundPattern() {
  pattern.innerHTML = `
    <g>
      <path d="${paths[wave]()}" fill="transparent" stroke="#f89ed2" stroke-width="${STROKE_WIDTH}" />
    </g>
    <animateTransform 
      attributeType="xml"
      attributeName="patternTransform"
      type="translate" 
      from="0" 
      to="${BACKGROUND_WIDTH}" 
      begin="0"
      dur="${Math.round(10 / speed) / 10}s" 
      repeatCount="indefinite" 
    />
  `;
}

async function play() {
  source = audioContext.createBufferSource();
  const response = await fetch(`/audio/${wave}.wav`);
  const arrayBuffer = await response.arrayBuffer();
  source.buffer = await audioContext.decodeAudioData(arrayBuffer);
  source.loop = true;
  source.playbackRate.value = speed;
  source.connect(gain);
  source.start();
  background.unpauseAnimations();
}

function stop() {
  if (source) {
    source.stop();
    background.pauseAnimations();
  }
}

playbackButton?.addEventListener('click', onPlayback);

function onPlayback() {
  if (!playbackButton) {
    return;
  }

  if (isPlaying) {
    playbackButton.setAttribute('name', 'play-fill');
    stop();
  } else {
    playbackButton.setAttribute('name', 'pause-fill');
    play();
  }

  isPlaying = !isPlaying;
}

for (const waveButton of waveButtons) {
  waveButton.addEventListener('click', function (this: HTMLButtonElement) {
    for (const waveButton of waveButtons) {
      if (waveButton === this) {
        const waveBefore = wave;
        waveButton.classList.add('selected');
        wave = (waveButton.id.split('-').shift() as Wave) ?? 'sine';
        setBackgroundPattern();

        if (isPlaying && wave !== waveBefore) {
          stop();
          play();
        }
      } else {
        waveButton.classList.remove('selected');
      }
    }
  });
}

volumeFader?.addEventListener('sl-change', (event: Event) => {
  volume = gain.gain.value = +(event.target as HTMLInputElement).value;
  height = volume * BACKGROUND_MIDPOINT_HEIGHT * 0.8;
  setBackgroundPattern();
});

volumeFader.tooltipFormatter = (volume: number): string => {
  return `${volume * 100}%`;
};

speedFader?.addEventListener('sl-change', (event: Event) => {
  speed = +(event.target as HTMLInputElement).value;
  setBackgroundPattern();

  if (source) {
    source.playbackRate.value = speed;
  }
});

speedFader.tooltipFormatter = (speed: number): string => {
  return `${speed}x`;
};
