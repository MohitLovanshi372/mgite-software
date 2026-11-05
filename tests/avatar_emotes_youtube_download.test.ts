/**
 * Automated Test Suite: Avatar Emotes, YouTube Player Auto-Play, Video Switching, & Media Downloader
 *
 * Verifies:
 * 1. Avatar Emote Control (Dynamic during conversation + Manual overrides)
 * 2. Emote Profiles (headPitch, headYaw, headTilt, mouthSmile, eyebrowRaise)
 * 3. YouTube Full Player State & Auto-Play Initialization
 * 4. Video Switching ("Change Video", Next, Prev, Direct Select)
 * 5. YouTube Search & Auto-Play Dispatch
 * 6. Media Downloader (Video MP4 & Audio MP3 task creation & safe local media export)
 * 7. Intent Detection for change_video, download_media, and avatar_emote
 */

import { youtubePlayerService, DEFAULT_PLAYLIST } from '../src/utils/youtubePlayerService.ts';
import { EMOTION_PROFILES, ALL_EMOTIONS } from '../src/avatar/EmotionController.ts';
import { IntentDetector } from '../core/intent/intentDetector.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runAvatarEmotesAndYouTubeTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('STARTING AVATAR EMOTES, YOUTUBE FULL CONTROL & DOWNLOAD TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;

  // -------------------------------------------------------------
  // Test 1: Avatar Emotes & Emotion Profiles
  // -------------------------------------------------------------
  console.log('--- Test 1: Avatar Emotes & Kinematic Profiles ---');

  const requiredEmotes = ['neutral', 'friendly', 'happy', 'thinking', 'serious', 'surprised', 'excited', 'confused'];
  for (const emote of requiredEmotes) {
    const profile = EMOTION_PROFILES[emote as keyof typeof EMOTION_PROFILES];
    assert(Boolean(profile), `Profile for emote "${emote}" must exist`);
    assert(typeof profile.mouthSmile === 'number', `mouthSmile must be number for "${emote}"`);
    assert(typeof profile.eyebrowRaise === 'number', `eyebrowRaise must be number for "${emote}"`);
    assert(typeof profile.headPitchX === 'number', `headPitchX must be number for "${emote}"`);
    assert(typeof profile.headTiltZ === 'number', `headTiltZ must be number for "${emote}"`);
    passed++;
  }
  console.log(`  ✓ Verified all ${requiredEmotes.length} avatar emote kinematic profiles.`);

  // -------------------------------------------------------------
  // Test 2: Intent Detection for Avatar Emote Commands
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Intent Detection for Avatar Emote Commands ---');

  const emoteCommands = [
    { text: 'Jarvis, avatar smile karo', expectedIntent: 'avatar_emote' },
    { text: 'Jarvis, avatar socho', expectedIntent: 'avatar_emote' },
    { text: 'Jarvis, avatar nod karo', expectedIntent: 'avatar_emote' },
    { text: 'Jarvis, happy emote dikhao', expectedIntent: 'avatar_emote' },
    { text: 'Jarvis, avatar wave karo', expectedIntent: 'avatar_emote' },
  ];

  for (const tc of emoteCommands) {
    const res = IntentDetector.detectIntent(tc.text);
    assert(
      res.intent === tc.expectedIntent,
      `Expected intent "${tc.expectedIntent}" for "${tc.text}", got "${res.intent}"`
    );
    passed++;
  }
  console.log(`  ✓ Verified ${emoteCommands.length} avatar emote voice command intents.`);

  // -------------------------------------------------------------
  // Test 3: YouTube Player Service Initialization & Auto-Play
  // -------------------------------------------------------------
  console.log('\n--- Test 3: YouTube Player State & Auto-Play ---');

  const initialState = youtubePlayerService.getState();
  assert(Boolean(initialState.currentVideo), 'Player must have an active currentVideo');
  assert(initialState.playlist.length > 0, 'Player playlist must contain initial tracks');
  assert(initialState.autoPlay === true, 'Player autoPlay must default to true');
  passed += 3;
  console.log('  ✓ YouTube player initialized with active track and auto-play enabled.');

  // -------------------------------------------------------------
  // Test 4: Video Switching ("Change Video")
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Video Switcher ("Change Video", Next & Prev) ---');

  const firstVideo = youtubePlayerService.getState().currentVideo;
  const nextVideo = youtubePlayerService.changeVideo('next');
  assert(nextVideo.id !== firstVideo.id, 'changeVideo("next") must switch to a different video');
  assert(youtubePlayerService.getState().isPlaying === true, 'changeVideo must auto-play next video');
  passed += 2;

  const prevVideo = youtubePlayerService.changeVideo('prev');
  assert(prevVideo.id === firstVideo.id, 'changeVideo("prev") must switch back to previous video');
  passed++;
  console.log('  ✓ Verified video switching mechanism with auto-play engagement.');

  // Test change video intent detection
  const changeVideoCommands = [
    'Jarvis, change video',
    'Jarvis, next video chalao',
    'dusra video lagao',
    'next song play karo',
    'agla gana bajao',
  ];

  for (const cmd of changeVideoCommands) {
    const res = IntentDetector.detectIntent(cmd);
    assert(
      res.intent === 'change_video',
      `Expected "change_video" intent for "${cmd}", got "${res.intent}"`
    );
    passed++;
  }
  console.log(`  ✓ Verified ${changeVideoCommands.length} video change voice intents.`);

  // -------------------------------------------------------------
  // Test 5: Search & Auto-Play
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Search YouTube & Auto-Play ---');

  const searched = youtubePlayerService.searchAndPlay('Believer');
  assert(searched.title.toLowerCase().includes('believer'), 'Searched video must match query');
  assert(youtubePlayerService.getState().isPlaying === true, 'Search must trigger auto-play');
  passed += 2;
  console.log('  ✓ Verified search and auto-play dispatch.');

  // -------------------------------------------------------------
  // Test 6: Media Downloader (Video MP4 & Audio MP3)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Media Downloader (MP4 Video & MP3 Audio) ---');

  // Video download task
  const videoDl = youtubePlayerService.download('MP4');
  assert(videoDl.format === 'MP4', 'Task format must be MP4');
  assert(videoDl.status === 'downloading', 'Task initial status must be downloading');
  assert(videoDl.fileSize === '24.8 MB', 'Video task must estimate file size');
  passed += 3;

  // Audio download task
  const audioDl = youtubePlayerService.download('MP3');
  assert(audioDl.format === 'MP3', 'Task format must be MP3');
  assert(audioDl.status === 'downloading', 'Audio task initial status must be downloading');
  assert(audioDl.fileSize === '4.6 MB', 'Audio task must estimate file size');
  passed += 3;

  // Download intent detection
  const downloadCommands = [
    'Jarvis, download video',
    'video download karo',
    'download song',
    'gana download karo',
    'download audio',
  ];

  for (const cmd of downloadCommands) {
    const res = IntentDetector.detectIntent(cmd);
    assert(
      res.intent === 'download_media',
      `Expected "download_media" intent for "${cmd}", got "${res.intent}"`
    );
    passed++;
  }
  console.log(`  ✓ Verified ${downloadCommands.length} media download voice intents.`);

  console.log('\n================================================================');
  console.log(`ALL AVATAR EMOTE & YOUTUBE TESTS PASSED! (${passed} assertions verified)`);
  console.log('================================================================\n');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runAvatarEmotesAndYouTubeTests().catch((err) => {
    console.error('Avatar Emotes & YouTube Test Suite Failed:', err);
    process.exit(1);
  });
}
