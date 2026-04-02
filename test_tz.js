const d = new Date('2024-04-01T10:00:00+05:00');

console.log("Original Date Object:", d.toISOString());
console.log("UTC Hours:", d.getUTCHours()); // 5
console.log("Local Hours:", d.getHours());  // depends on system

const tashkentTimeString = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
console.log("Tashkent TimeString (Node):", tashkentTimeString); // 10:00

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tashkent',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false
}).format(d);
console.log("Parts:", parts); 
