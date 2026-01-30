import { useState, useEffect } from 'react';

const PAKISTAN_TIMEZONE = 'Asia/Karachi';

interface TimeData {
  percentage: number;
  year: number;
  formattedDate: string;
}

const calculateYearProgress = (): TimeData => {
  // Get current time in Pakistan timezone
  const now = new Date();
  const pakistanTime = new Date(now.toLocaleString('en-US', { timeZone: PAKISTAN_TIMEZONE }));
  
  const year = pakistanTime.getFullYear();
  
  // Start of current year in Pakistan timezone
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  
  // Start of next year
  const startOfNextYear = new Date(year + 1, 0, 1, 0, 0, 0, 0);
  
  // Total milliseconds in this year (accounts for leap years automatically)
  const totalMillisInYear = startOfNextYear.getTime() - startOfYear.getTime();
  
  // Milliseconds elapsed this year
  const elapsedMillis = pakistanTime.getTime() - startOfYear.getTime();
  
  // Calculate percentage with 2 decimal precision
  const percentage = (elapsedMillis / totalMillisInYear) * 100;
  
  // Format date: Month Day, hh:mm AM/PM
  const formattedDate = pakistanTime.toLocaleString('en-US', {
    timeZone: PAKISTAN_TIMEZONE,
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    percentage: Math.round(percentage * 100) / 100, // 2 decimal places
    year,
    formattedDate
  };
};

const YearProgress = () => {
  const [timeData, setTimeData] = useState<TimeData>(calculateYearProgress);
  
  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setTimeData(calculateYearProgress());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Main percentage display */}
        <div className="text-center space-y-2">
          <h1 className="percentage-text text-5xl sm:text-6xl text-foreground glow-text animate-pulse-subtle">
            {timeData.percentage.toFixed(2)}%
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            of <span className="text-foreground font-medium">{timeData.year}</span> has passed
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full pt-4">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${timeData.percentage}%` }}
            />
          </div>
        </div>
        
        {/* Current date and time */}
        <div className="text-center pt-6">
          <p className="time-text text-sm sm:text-base text-muted-foreground">
            {timeData.formattedDate}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Pakistan Standard Time
          </p>
        </div>
      </div>
    </div>
  );
};

export default YearProgress;
