export function arraysEqual (a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (var i = 0; i < a.length; i++) {
    // Note that this assumes that the elements in each
    // array are all primitive data types
    if (a[i] !== b[i]) return false
  }

  return true
}
