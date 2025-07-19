(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/evenements/upcoming/1');
    if (!res.ok) {
      console.error('Request failed with status', res.status);
      return;
    }
    const data = await res.json();
    console.log('Received', Array.isArray(data) ? data.length : 0, 'events');
  } catch (err) {
    console.error('Error fetching upcoming events:', err.message);
  }
})();
