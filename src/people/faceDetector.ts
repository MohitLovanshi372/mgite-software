import type { FaceObservation } from './faceMemory.ts';
let ready: Promise<typeof import('face-api.js')> | null = null;
export function loadFaceDetector() {
  if (!ready) ready = import('face-api.js').then(async api => {
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri('/models/face-memory'),
      api.nets.faceLandmark68TinyNet.loadFromUri('/models/face-memory'),
      api.nets.faceRecognitionNet.loadFromUri('/models/face-memory'),
    ]);
    return api;
  }).catch(error => { ready = null; throw error; });
  return ready;
}
export async function detectFaces(video: HTMLVideoElement): Promise<FaceObservation[]> {
  const api = await loadFaceDetector();
  const faces = await api.detectAllFaces(video, new api.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: .5 })).withFaceLandmarks(true).withFaceDescriptors();
  return faces.map(({ detection: { box }, descriptor }) => ({ descriptor: Array.from(descriptor), x: box.x / video.videoWidth, y: box.y / video.videoHeight, width: box.width / video.videoWidth, height: box.height / video.videoHeight }));
}
