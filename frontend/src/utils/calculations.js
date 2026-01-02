export const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  
  if (returned <= due) return 0;
  
  const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
  const finePerDay = 5; // ₹5 per day
  return daysLate * finePerDay;
};

export const calculateDaysOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? Math.abs(diffDays) : 0;
};