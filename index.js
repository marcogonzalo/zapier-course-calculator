// this is wrapped in an `async` function
// you can use await throughout the function

// Internal functions
function getHolidaysMap(date) {
  const currentYear = date.getFullYear();
  const holidaysObj = (year) => Object.fromEntries(getYearHolidays(year).map(key => [key.toDateString(), true]));
  if (date.getMonth() < 6) return holidaysObj(currentYear);
  return { ...holidaysObj(currentYear), ...holidaysObj(currentYear + 1) };
}

function getScheduledDays(schedule) {
  return schedule === "MWF" || schedule === "MWF - Mornings" ? [1, 3, 5] : [2, 4, 6];
}

function getYearHolidays(year) {
  // Holiday dates that change every year
  const customHolidays = [
    new Date(`${year}-04-25`), // Viernes Santo
    new Date(`${year}-04-26`), // Sábado SS
  ];
  // Permanent holidays 
  const yearlyHolidays = [
    new Date(`${year}-01-01`), // Año nuevo
    new Date(`${year}-01-06`), // Reyes
    new Date(`${year}-05-01`), // Día del trabajo
    new Date(`${year}-08-15`), // Asunción de la Virgen
    new Date(`${year}-10-12`), // Fiesta Nacional Española
    new Date(`${year}-11-01`), // Todos los Santos
    new Date(`${year}-12-06`), // Constitución
    new Date(`${year}-12-08`), // Inmaculada Concepción
    new Date(`${year}-12-25`), // Natividad del Señor
  ];
  return yearlyHolidays.concat(customHolidays);
}

// Utils
function isHoliday(date) {
  const holidayMap = getHolidaysMap(date);
  return holidayMap.hasOwnProperty(date.toDateString());
}

function isClassBreak(date,classBreak) {
  //type classBreak {
  //firstDate: Date,
  //lastDate: Date,
  //};
   return date >= classBreak.firstDate && date < classBreak.lastDate;
}

function getNextAvailableDate(date, classBreak) {
  const lastDate = new Date (classBreak.lastDate)
  if (isClassBreak(date,classBreak)) date = lastDate;
  while (isHoliday(date)) {
    date.setDate(date.getDate() + 1);
  }
  return date
}

// Avoid finishing on Course start days
function avoidFinishingOnCourseStartDays(date) {
  if (date.getDay() == 1 || date.getDay() == 2) { 
    date.setDate(date.getDate() + 2);
  }
  return date;
}

function calculateNPSDates(currentDate, formatEndDate) {
  const npsDates = new Array(5).fill(formatEndDate); // Last npsDate will match with last class day
  const classesToNextNPS = program[inputData.program]["NPSperiod"];

  let npsCount = 0;
  let classesAfterLastNPS = 1;
  do {
    currentDate.setDate(currentDate.getDate() + 1);
    if (!scheduleDays.includes(currentDate.getDay())) continue;
    // Do the checks only if it is a scheduled day
    
    // Skip break dates
    if (currentDate >= classBreak.firstDate && currentDate < classBreak.lastDate) {
      currentDate = new Date(classBreak.lastDate);
      continue
    }
  
    classesAfterLastNPS++;
  

    // Delay NPS in holidays
    if (holidayMap.hasOwnProperty(currentDate.toDateString())) {
      classesToNextNPS[npsCount] += 1
    }

    // If it is time to NPS or it has been exceeded (calculation errors)
    if (classesAfterLastNPS >= classesToNextNPS[npsCount]) {
      npsDates[npsCount] = currentDate.toDateString();
      classesAfterLastNPS = 0;
      npsCount++;
    }
  } while (npsCount < npsDates.length - 1); // Last npsDate will match with last class day

  return npsDates;
}

function calculateCourse(inputData) {
  // Calculate endDate of the course 
  let countDays = 1;
  
  do {
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate = getNextAvailableDate(currentDate,classBreak) 
    if (scheduleDays.includes(currentDate.getDay())) countDays++;
  } while (countDays <= daysToFinishCourse);
  
  let endDate = new Date(avoidFinishingOnCourseStartDays(currentDate))
  
  // Calculate NPS dates of the course 
  // Set premises from inputData
  currentDate = new Date(inputData.startDate);
  const lastClassDate = new Date(endDate);
  const formatStartDate = currentDate.toDateString();
  const formatEndDate = lastClassDate.toDateString();
  
  const npsDates = calculateNPSDates(currentDate, formatEndDate);
  
  // Calculate prework start date
  let preworkStartDate = new Date(inputData.startDate)
  preworkStartDate.setDate(preworkStartDate.getDate()-14)
  const formatPreworkStartDate = preworkStartDate.toDateString()
  
  return { nextNPS: npsDates[0], npsDates: npsDates.join(","), formatStartDate, formatEndDate, formatPreworkStartDate };
}


// Constants
const classBreak = {
    firstDate: new Date("2024-12-22"),
    lastDate: new Date("2025-01-06"),
  };

const program = {
  "Full Stack (Python)" : {
    "days": 54,
    "NPSperiod": [5, 12, 12, 12]
  },
  "Data Science/ML" :{
    "days": 48,
    "NPSperiod": [5, 12, 12, 9]
  },
  "Cybersecurity" : {
    "days": 48,
    "NPSperiod": [5, 12, 12, 9]
  },
  "Full Stack (Node)": {
    "days": 48,
    "NPSperiod": [5, 12, 12, 9]
  },
}

let currentDate = new Date(inputData.startDate);
const holidayMap = getHolidaysMap(currentDate);
const scheduleDays = getScheduledDays(inputData.schedule);
const extraDays = Number(inputData.extraDays) || 0;
const daysToFinishCourse = program[inputData.program]["days"];

output = calculateCourse(inputData);
console.log(output)
