export function generatedId(): string {
  const min = 10000; 
  const max = 99999; 
  const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomId.toString(); 
}
