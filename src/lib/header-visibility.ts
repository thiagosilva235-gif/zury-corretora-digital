/** Keep the navbar available at the top and while a menu or keyboard control is in use. */
export function headerShouldHide(
  hidden: boolean,
  previousY: number,
  currentY: number,
  interacting: boolean,
): boolean {
  if (interacting || currentY <= 80) return false;
  if (currentY > previousY + 2) return true;
  if (currentY < previousY - 2) return false;
  return hidden;
}
