# People memory and arrival greetings

Choose **Enable greetings** in the camera-status strip on the JARVIS screen or in **People memory**. Camera access requires HTTPS or localhost. The camera feed is never displayed. A visible **Camera on** indicator and **Stop camera** button remain available while detection runs. It stays active across pages within the app, and stops on explicit Stop, app close, or reload. It does not restart automatically after reload.

A person approaching the front of the camera must remain stable for several scans before JARVIS addresses them. Side passers-by and small, distant faces do not trigger greetings. A saved person is greeted by name with “How are you? It is lovely to see you again.” A new person hears a welcome and a question asking their name. Replies are captured one person at a time. Type instead if speech recognition is unavailable.

Review the name and choose **Save name**. JARVIS then acknowledges the introduction, asks how they are, and routes their reply to the existing chat workflow. Profiles are never saved just because someone appears on camera. The people page lists approximate camera positions for selecting someone manually without showing their image.

Greetings are paced, suppressed during other assistant activity, and not repeated while the same person stays in view. Returning known people must have been absent for at least 15 seconds, with at least 60 seconds since their previous greeting. Unknown appearances are suppressed for five minutes after being addressed, even if tracking IDs change. Use **Ask & listen** to retry manually. Disable automatic greetings on the people page to keep detection without unsolicited introductions.

Face descriptors and names are stored in IndexedDB on this browser and origin. Raw camera frames are neither uploaded nor stored. Face models are bundled in `public/models/face-memory`; no provider key or model CDN is needed at runtime. Browser voice recognition may use the browser vendor’s online speech service. Typed names do not need that service. Simple greeting replies such as “Main theek hoon”, “How are you?” and “Thank you” work locally. Other conversation replies use the app’s existing configured AI/offline route.

Save only people who agree to be remembered. The site can access its stored face descriptors; they are not encrypted with a separate user key. Use the trash button to forget a person or **Delete all** to clear the collection. Profiles do not sync across devices, and clearing the site's browser data removes them.

Face matching is approximate and works best front-facing in good light. It is not authentication or a liveness check and can match a photograph. Similar-looking people, side profiles, occlusion and lighting can affect recognition. Ambiguous matches remain unknown.

## Implementation and validation

- `src/people/faceDetector.ts`: lazy-loaded face detection, landmarks and descriptors.
- `src/people/faceMemory.ts`: conservative matching, tracking, normalization and IndexedDB.
- `src/people/presenceGreetings.ts`: arrival eligibility, repeat suppression and greeting text.
- `src/pages/PeopleMemory.tsx`: persistent hidden video, visible controls, introductions and conversation handoff.
- `npm run test:face-memory` and `npm run test:greetings`: matching, tracking, arrivals, ambiguity, disappearance, cooldowns and names.
- Model provenance, hashes and license are included beside the models.

Browser integration checks use an upstream example image as a simulated camera and simulated speech-recognition replies. They validate real model inference and browser storage, but do not establish physical webcam, microphone, or speaker quality.
