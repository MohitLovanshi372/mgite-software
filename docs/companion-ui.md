# Human companion workspace

The overview opens on the animated human-boy avatar. Navy surfaces and warm gold controls keep the portrait prominent; the left navigation starts as an icon rail and the companion settings panel starts collapsed. Expand either panel to access the existing pages, voice personalities, languages and shortcuts. On phones, use **Explore workspace** to reveal navigation and **Companion settings** below the conversation for voice preferences.

The portrait keeps the existing speech animation pipeline: synthesized audio drives mouth movement through Web Audio, while browser speech uses timing and speech boundaries as an approximation. Stop cancels playback and closes the mouth. Reduced motion suppresses idle movement while preserving speech feedback. If WebGL is unavailable, text and voice remain accessible.

Camera preview stays hidden, including the optional gesture camera. Face detection retains its visible status and Stop camera control; see [People memory](people-memory.md) for enrollment, local storage and greetings.

Validation: TypeScript, production build, the existing application suite and 31 targeted voice/lip-sync/face/greeting tests pass. Chromium checks cover audio-driven mouth movement and cancellation, avatar remounting, hidden-camera introductions and saved-person greetings. Responsive panel/navigation checks passed at widths 320, 390, 768, 1024 and 1440 pixels without horizontal overflow. Camera and microphone input were simulated; physical hardware and configured cloud speech providers were not tested. The build retains existing large-bundle and browser-externalized Node-module warnings.
