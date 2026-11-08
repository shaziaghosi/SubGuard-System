const getIndiaDateKey = (date) => {
  const indiaDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  return Date.UTC(
    indiaDate.getFullYear(),
    indiaDate.getMonth(),
    indiaDate.getDate()
  );
};
const testDate = new Date("2026-11-05T20:00:00.000Z");

const result = new Date(
  getIndiaDateKey(testDate)
).toISOString();

console.log("Original UTC date:", testDate.toISOString());
console.log("India calendar date:", result);
