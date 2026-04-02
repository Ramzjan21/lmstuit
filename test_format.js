const due = new Date('2024-04-01T02:00:00+05:00');
console.log(
  new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Tashkent', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(due)
);
