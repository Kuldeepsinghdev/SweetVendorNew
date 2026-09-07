/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DateItem {
  date: string;
  labelHi: string;
  dayHi: string;
  labelEn: string;
  dayEn: string;
}

/**
 * Computes an array of all dates between startStr and endStr inclusive.
 */
export function getDatesBetween(startStr: string, endStr: string): DateItem[] {
  const result: DateItem[] = [];
  if (!startStr || !endStr) return result;

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [{ date: startStr, labelHi: startStr, dayHi: '', labelEn: startStr, dayEn: '' }];
  }

  const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const monthsHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const curr = new Date(start);
  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dateIso = `${year}-${month}-${day}`;

    const dayName = daysHi[curr.getDay()];
    const monthName = monthsHi[curr.getMonth()];
    const dayNum = curr.getDate();

    result.push({
      date: dateIso,
      labelHi: `${dayNum} ${monthName.slice(0, 3)}`,
      dayHi: dayName,
      labelEn: `${dayNum} ${monthsEn[curr.getMonth()]}`,
      dayEn: daysEn[curr.getDay()],
    });

    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

/**
 * Formats ISO YYYY-MM-DD into readable Hindi string
 */
export function formatDateHindi(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const monthsHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  return `${d.getDate()} ${monthsHi[d.getMonth()]} ${d.getFullYear()} (${daysHi[d.getDay()]})`;
}
