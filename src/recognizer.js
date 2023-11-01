import {createModel} from 'vosk-browser'



let _recogniser = null;
const getRecognizer = async () => {
  if(_recogniser) return _recogniser;
  const model = await createModel((process.env.PUBLIC_URL || '') + '/model.tar.gz');

  const recognizer = new model.KaldiRecognizer(16000);
  recognizer.setWords(true);

  _recogniser = recognizer;
  return recognizer;
}


export function createRecognizer() {

  let _audioContext = null;
  
  let _onResult = ()=>{};
  let _onPartialResult = ()=>{};

  let _started = false;

  let _stream = null;


  const recognizerP = getRecognizer().then(r => {
    r.on("result", e => _onResult(e));
    r.on("partialresult", e => _onPartialResult(e));
    return r;
  });

    
  async function connect() {
    const recognizer = await recognizerP;
    _audioContext =  new AudioContext({
      sampleRate: 16000,
      channelCount: 1
    });
  

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
      }
    });

    const recognizerNode = _audioContext.createScriptProcessor(4096, 1, 1);
    recognizerNode.onaudioprocess = (event) => {
      try {
          recognizer.acceptWaveform(event.inputBuffer)
      } catch (error) {
          console.error('acceptWaveform failed', error)
      }
    }
    const source = _audioContext.createMediaStreamSource(mediaStream);

    _stream = mediaStream;
    source.connect(recognizerNode);
    recognizerNode.connect(_audioContext.destination);
  }

  return {
    start: async () => {
      if (!_started) {
        _started = true;
        await connect();
      }

      _audioContext.resume();
    },

    onEvent: (onResult = ()=>{}, onPartialResult = ()=>{}) => {
      _onResult = onResult;
      _onPartialResult = onPartialResult;
    },

    stop: () => {
      _audioContext.close();
      _stream.getTracks().forEach(track => track.stop());
      _stream.getTracks().forEach(track => _stream.removeTrack(track));
      _started = false;
    },

    suspend: () => {
      _audioContext.suspend();
    },

    resume: () => {
      _audioContext.resume();
    },
  };
}