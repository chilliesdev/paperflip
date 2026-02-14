const segments = ["hello world", "foo bar", "baz qux"]; // 3 segments
const currentIndex = 1; // 2nd segment
const currentProgress = 5; // "foo b" (length 7)
const segmentLength = segments[currentIndex].length; // 7

const granularProgress = currentIndex + currentProgress / segmentLength;
// 1 + 5/7 = 1.714
const progress = Math.round((granularProgress / segments.length) * 100);
// (1.714 / 3) * 100 = 57.14 -> 57

console.log({ currentIndex, currentProgress, segmentLength, granularProgress, progress });
