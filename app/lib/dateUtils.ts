// 1. FORMATTING: Shows "Oct 24, 4:00 PM (EST)"
export const formatLocalTime = (isoString: string | undefined) => {
  if (!isoString) return "Pending";
  
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short', // Adds the timezone suffix (e.g. EST, AEDT)
  }).format(date);
};

// 2. DETECTION: Gets the user's timezone (e.g. "Australia/Melbourne")
export const getUserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// 3. PARSING: Forces input "2025-12-17T14:00" to be treated as Local Time
export const createDateFromLocalInput = (inputValue: string) => {
  if (!inputValue) return new Date();

  const [datePart, timePart] = inputValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Uses system local clock to construct the date object
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  return localDate;
};