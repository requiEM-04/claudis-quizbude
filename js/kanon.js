// Macht aus einer Eingabe eine vergleichbare Form: klein, ohne Akzente, ohne Leerzeichen.
// „Türkei", „Tuerkei" und „turkei" landen alle bei „turkei".
export function kanon(s) {
  return String(s).toLowerCase().replace(/&/g, ' und ').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(und|and|the)\b/g, ' ')
    .replace(/\b(sankt|saint|st)\b\.?/g, 'st')
    .replace(/[^a-z0-9]/g, '')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}
