/**
 * Safe YouTube and Music Control Test Suite
 *
 * Validates:
 * 1. Open YouTube ("Jarvis, open YouTube", "Jarvis, YouTube kholo")
 * 2. Search Music ("Jarvis, play Arijit Singh music", "Arijit Singh ke songs chalao", "search relaxing music on YouTube", "play Believer")
 * 3. Play Music Generic ("Jarvis, play music", "Jarvis, music chalao")
 * 4. Stop / Pause Music ("Jarvis, stop music", "Jarvis, music band karo")
 * 5. Strict Allowlist & Domain Validation (https://www.youtube.com only)
 * 6. Protection against Shell Execution, Malicious URLs, and Command Injection
 */

import { IntentDetector } from '../core/intent/intentDetector.ts';
import { parseHinglishCommand } from '../src/utils/languageModel.ts';
import { safeBrowserControl } from '../core/tools/browserControl.ts';
import { toolAllowlist } from '../core/tools/allowlist.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runYouTubeMusicControlTests() {
  console.log('--- Running Safe YouTube & Music Control Tests ---');

  // 1. Tool Allowlist Registration
  console.log('1. Verifying Tool Allowlist Registration...');
  assert(toolAllowlist.isAllowed('open_youtube'), 'open_youtube must be registered in toolAllowlist');
  assert(toolAllowlist.isAllowed('search_youtube'), 'search_youtube must be registered in toolAllowlist');
  assert(toolAllowlist.isAllowed('play_music'), 'play_music must be registered in toolAllowlist');
  assert(toolAllowlist.isAllowed('stop_music'), 'stop_music must be registered in toolAllowlist');
  assert(!toolAllowlist.isAllowed('arbitrary_shell_exec'), 'Unregistered tools must not be allowed');
  console.log('   ✓ Tool allowlist correctly configured with safe execution boundaries.');

  // 2. Feature 1: OPEN YOUTUBE
  console.log('2. Testing OPEN YOUTUBE Intent & Actions...');
  const openCmds = [
    'Jarvis, open YouTube',
    'Jarvis, YouTube kholo',
    'open YouTube',
    'YouTube kholo',
    'यूट्यूब खोलो',
  ];

  for (const cmd of openCmds) {
    const intentRes = IntentDetector.detectIntent(cmd);
    assert(
      intentRes.intent === 'open_youtube',
      `Command "${cmd}" must resolve to intent "open_youtube", got "${intentRes.intent}"`
    );

    const parsedHinglish = parseHinglishCommand(cmd);
    assert(
      parsedHinglish.intent === 'open_youtube',
      `parseHinglishCommand("${cmd}") must have intent "open_youtube", got "${parsedHinglish.intent}"`
    );
  }

  // Execute open_youtube tool
  const openExec = await safeBrowserControl.executeTool('open_youtube');
  assert(openExec.success === true, 'open_youtube tool execution must succeed');
  assert(
    openExec.message === 'YouTube open kar rahi hoon.',
    `Voice confirmation must be "YouTube open kar rahi hoon.", got "${openExec.message}"`
  );
  assert(
    openExec.url === 'https://www.youtube.com',
    `Target URL must be "https://www.youtube.com", got "${openExec.url}"`
  );
  console.log('   ✓ Open YouTube intents and voice confirmation verified.');

  // 3. Feature 2: SEARCH MUSIC
  console.log('3. Testing SEARCH MUSIC Intent & Query Extraction...');
  const searchTestCases = [
    {
      cmd: 'Jarvis, play Arijit Singh music',
      expectedQueryPart: 'Arijit Singh music',
    },
    {
      cmd: 'Jarvis, Arijit Singh ke songs chalao',
      expectedQueryPart: 'Arijit Singh songs',
    },
    {
      cmd: 'Jarvis, search relaxing music on YouTube',
      expectedQueryPart: 'relaxing music',
    },
    {
      cmd: 'Jarvis, play Believer',
      expectedQueryPart: 'Believer',
    },
  ];

  for (const testCase of searchTestCases) {
    const intentRes = IntentDetector.detectIntent(testCase.cmd);
    assert(
      intentRes.intent === 'search_youtube',
      `Command "${testCase.cmd}" must resolve to "search_youtube", got "${intentRes.intent}"`
    );

    const query = intentRes.query || intentRes.entities?.query;
    assert(
      Boolean(query && query.toLowerCase().includes(testCase.expectedQueryPart.toLowerCase())),
      `Query for "${testCase.cmd}" must match "${testCase.expectedQueryPart}", got "${query}"`
    );

    // Execute search_youtube tool
    const searchExec = await safeBrowserControl.executeTool('search_youtube', { query });
    assert(searchExec.success === true, `Search execution for "${query}" must succeed`);
    assert(
      searchExec.message === `Sure, ${query} search kar rahi hoon.`,
      `Voice response must confirm query: "Sure, ${query} search kar rahi hoon.", got "${searchExec.message}"`
    );
    assert(
      searchExec.url.startsWith('https://www.youtube.com/results?search_query='),
      `Search URL must be inside YouTube domain, got "${searchExec.url}"`
    );
  }
  console.log('   ✓ Music search queries extracted and YouTube search URLs validated.');

  // 4. Feature 3: PLAY MUSIC (GENERIC)
  console.log('4. Testing PLAY MUSIC (Generic)...');
  const genericCmds = [
    'Jarvis, play music',
    'Jarvis, music chalao',
    'music chalao',
    'play music',
  ];

  for (const cmd of genericCmds) {
    const intentRes = IntentDetector.detectIntent(cmd);
    assert(
      intentRes.intent === 'play_music',
      `Command "${cmd}" must resolve to "play_music", got "${intentRes.intent}"`
    );
  }

  const playExec = await safeBrowserControl.executeTool('play_music');
  assert(playExec.success === true, 'play_music tool execution must succeed');
  assert(
    playExec.message === 'YouTube open kar rahi hoon.',
    `Voice confirmation must be "YouTube open kar rahi hoon.", got "${playExec.message}"`
  );
  assert(
    playExec.url === 'https://www.youtube.com',
    `play_music URL must target YouTube homepage, got "${playExec.url}"`
  );
  console.log('   ✓ Generic music play intent and actions verified.');

  // 5. Feature 4: STOP / PAUSE MUSIC
  console.log('5. Testing STOP / PAUSE MUSIC...');
  const stopCmds = [
    'Jarvis, stop music',
    'Jarvis, music band karo',
    'music roko',
    'gana band karo',
  ];

  for (const cmd of stopCmds) {
    const intentRes = IntentDetector.detectIntent(cmd);
    assert(
      intentRes.intent === 'stop_music',
      `Command "${cmd}" must resolve to "stop_music", got "${intentRes.intent}"`
    );
  }

  const stopExec = await safeBrowserControl.executeTool('stop_music');
  assert(stopExec.success === true, 'stop_music tool execution must succeed');
  assert(
    stopExec.message === 'Music band kar di gayi hai.',
    `Voice confirmation must be "Music band kar di gayi hai.", got "${stopExec.message}"`
  );
  console.log('   ✓ Stop music intent and voice confirmation verified.');

  // 6. SAFETY RULES & DOMAIN ALLOWLIST
  console.log('6. Testing Safety Rules, Domain Allowlist & URL Sanitization...');
  
  // Safe domains should pass
  assert(safeBrowserControl.isDomainAllowed('https://www.youtube.com'), 'youtube.com must be allowed');
  assert(safeBrowserControl.isDomainAllowed('https://youtube.com/watch?v=123'), 'youtube.com watch must be allowed');
  assert(safeBrowserControl.isDomainAllowed('https://www.youtube.com/results?search_query=test'), 'youtube.com search must be allowed');

  // Disallowed domains and malicious schemes must FAIL
  assert(!safeBrowserControl.isDomainAllowed('https://evil.com'), 'evil.com must NOT be allowed');
  assert(!safeBrowserControl.isDomainAllowed('https://google.com'), 'arbitrary external sites must NOT be allowed');
  assert(!safeBrowserControl.isDomainAllowed('javascript:alert(1)'), 'javascript: URLs must NOT be allowed');
  assert(!safeBrowserControl.isDomainAllowed('file:///etc/passwd'), 'file: URLs must NOT be allowed');
  assert(!safeBrowserControl.isDomainAllowed('http://youtube.com.attacker.com'), 'subdomain spoofing must NOT be allowed');

  // Command injection in query must be sanitized
  const maliciousQuery = 'test song; rm -rf / && nc -e /bin/sh';
  const sanitizedSearch = await safeBrowserControl.executeTool('search_youtube', { query: maliciousQuery });
  assert(sanitizedSearch.success === true, 'Sanitized search should execute safely');
  assert(
    !sanitizedSearch.url.includes('rm -rf'),
    'Raw shell commands must be URL-encoded, not executed in shell'
  );
  assert(
    sanitizedSearch.url.startsWith('https://www.youtube.com/results?search_query='),
    'Sanitized query must still point strictly to YouTube search'
  );

  console.log('   ✓ Domain allowlist and anti-injection defenses verified.');
  console.log('--- ALL SAFE YOUTUBE & MUSIC CONTROL TESTS PASSED (100%) ---');
}
