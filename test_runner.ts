import { readFileSync } from 'fs';
import { computeDiff } from './src/lib/diffEngine';

function runTest(id: string, name: string, orig: string, changed: string, expectAction: (res: any) => void) {
  try {
    const res = computeDiff(orig, changed, 'word');
    expectAction(res);
    console.log(`✅ [${id}] ${name} passed.`);
  } catch (err: any) {
    console.error(`❌ [${id}] ${name} FAILED:`, err.message);
  }
}

console.log("=== RUNNING DIFF ENGINE TEST SUITE ===");

// TC-01: Absolute Minimum (Empty to Empty)
runTest('TC-01', 'Absolute Minimum', '', '', (res) => {
  if (res.additions !== 0 || res.removals !== 0) throw new Error('Expected 0 additions and 0 removals');
});

// TC-02: Empty to Single Character (Insertion)
runTest('TC-02', 'Insertion', '', 'A', (res) => {
  if (res.additions !== 1 || res.removals !== 0) throw new Error('Expected 1 addition');
});

// TC-03: Single Character to Empty (Deletion)
runTest('TC-03', 'Deletion', 'A', '', (res) => {
  if (res.additions !== 0 || res.removals !== 1) throw new Error('Expected 1 removal');
});

// TC-04: Case Sensitivity Shift
runTest('TC-04', 'Case Shift', 'a', 'A', (res) => {
  if (res.additions !== 1 || res.removals !== 1) throw new Error('Expected 1 removal and 1 addition');
});

// TC-05: Space Injection
runTest('TC-05', 'Space Injection', 
  'The quick brown fox jumps over the lazy dog.', 
  'The  quick   brown  fox jumps  over the lazy dog.', 
  (res) => {
    // There are additions of spaces
    if (res.additions === 0) throw new Error('Expected changes in spaces');
  }
);

// TC-06: Tabs vs Spaces
runTest('TC-06', 'Tabs vs Spaces', 
  '    def test_function():', 
  '\tdef test_function():', 
  (res) => {
    if (res.additions === 0 || res.removals === 0) throw new Error('Expected replacement of space with tab');
  }
);

// TC-07: Line Breaks
runTest('TC-07', 'Line Breaks', 
  'Line 1\nLine 2\nLine 3', 
  'Line 1\n\nLine 2\nLine 3\n\n', 
  (res) => {
    if (res.original.length !== 3) throw new Error('Original should have 3 lines');
    if (res.modifiedLineCount !== 6) throw new Error('Modified should have 6 lines');
  }
);

// TC-08: Punctuation
runTest('TC-08', 'Punctuation', 
  'Hello, world! (This is a test) [v1.0] {status: "ok"}', 
  "Hello; world? (This is a test) [v1.1] {status: 'ok'}", 
  (res) => {}
);

// TC-09: Mathematical & Logical
runTest('TC-09', 'Mathematical', 
  'if (x < y && z == 10) { result = a / b + c * 2; }', 
  'if (x <= y || z != 10) { result = a \\ b - c ^ 2; }', 
  (res) => {}
);

// TC-10: Escape Sequences
runTest('TC-10', 'System Paths', 
  'Path: C:\\Users\\Admin\\.*$', 
  'Path: C:/Users/Admin/.+^', 
  (res) => {}
);

// TC-11: Multilingual UTF-8
runTest('TC-11', 'Multilingual', 
  'வணக்கம், Hello, 你好, Hola!', 
  'வணக்கம் உலகம், Hello there, 你好吗, ¡Hola!', 
  (res) => {}
);

// TC-12: Emojis
runTest('TC-12', 'Emojis', 
  'Test passed 🧑💻✅🏏', 
  'Test failed 👩💻❌🏆', 
  (res) => {}
);

// TC-13: Context Expansion
runTest('TC-13', 'Context Expansion', 
  'CSK needs 12 runs to win.', 
  'Chennai Super Kings need 12 runs to win the match.', 
  (res) => {}
);

// TC-14: The Everything Block - Stress Test
const origBlock = `Th!s_is_a_$TR3SS_t3st! \n    1234567890 @#$%^&*()_+~'-=[]\\{}|;':",./<>? \nLine\twith\ttabs.\nLine with spaces.\n    \nEnd of block.\n`;
const changedBlock = `Th1s_is_A_$TR3SS_T3st!\n    0987654321 @#$%^&*()_+~'-=[]\\{}|;':",./<>?\nLine    with    spaces instead of tabs.\nLine\twith\ttabs instead of spaces.\n\n\nEnd of block!\n`;

runTest('TC-14', 'Stress Test 1x', origBlock, changedBlock, (res) => {});

// Multiply by 500 for stress test
runTest('TC-14-STRESS', 'Massive Stress Test (x500)', origBlock.repeat(500), changedBlock.repeat(500), (res) => {
  if (res.originalLineCount < 3000) throw new Error('Failed to parse large lines');
});

console.log("=== COMPLETED ===");
