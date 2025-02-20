/*!
 * Built by Revolist
 */
const eq = (value, extra) => {
  if (typeof value === 'undefined' || (value === null && !extra)) {
    return true;
  }
  if (typeof value !== 'string') {
    value = JSON.stringify(value);
  }
  const filterVal = extra.toString().toLocaleLowerCase();
  if (filterVal.length === 0) {
    return true;
  }
  return value.toLocaleLowerCase() === filterVal;
};
export const notEq = (value, extra) => !eq(value, extra);
notEq.extra = 'input';
eq.extra = 'input';
export default eq;
