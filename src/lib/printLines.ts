/**
 * Joins an array of strings by a newline character (\n)
 *
 * @param {(Array<string> | string)} lines
 * @returns Combined lines as a string
 */
function printLines(lines: Array<string> | string) {
  if (typeof lines === 'string') {
    return lines
  }

  const linesAsString = lines.join('\n')

  return linesAsString
}

export default printLines
