import { useState, useEffect, useMemo } from 'react';

const PAKISTAN_TIMEZONE = 'Asia/Karachi';

interface TimeData {
  percentage: number;
  year: number;
  formattedDate: string;
  dayOfYear: number;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

// Quotes organized by year progress ranges
const QUOTES_BY_RANGE: Record<string, string[]> = {
  // 0-10% - New beginnings
  early: [
    "A new year is a blank canvas. Paint it boldly.",
    "The secret of getting ahead is getting started.",
    "Every moment is a fresh beginning.",
    "Small steps lead to big changes.",
    "Your only limit is your mind.",
    "Dream big, start small, act now.",
    "Today is the first chapter of a new story.",
  ],
  // 10-25% - Building momentum
  momentum: [
    "Progress, not perfection.",
    "You're further along than you were yesterday.",
    "Consistency is the key to mastery.",
    "Keep going. You're making it happen.",
    "The journey of a thousand miles begins with one step.",
    "Success is the sum of small efforts repeated daily.",
    "You don't have to be great to start, but you have to start to be great.",
  ],
  // 25-50% - First quarter done
  quarter: [
    "You've built momentum. Now push harder.",
    "Halfway to halfway. Stay focused.",
    "Winners never quit, quitters never win.",
    "The harder you work, the luckier you get.",
    "Your future self is watching. Make them proud.",
    "Don't watch the clock; do what it does. Keep going.",
    "Great things take time. Trust the process.",
  ],
  // 50-75% - Second half
  midyear: [
    "The second half is where champions are made.",
    "You still have time to make this your year.",
    "Finish what you started.",
    "Don't count the days, make the days count.",
    "The only way to do great work is to love what you do.",
    "Stay hungry, stay foolish.",
    "It's not over until you win.",
  ],
  // 75-90% - Final push
  final: [
    "The finish line is in sight. Sprint.",
    "Strong finish. No excuses.",
    "Make these final months count.",
    "You've come too far to quit now.",
    "End the year stronger than you started.",
    "Champions finish what they start.",
    "The last stretch demands your best.",
  ],
  // 90-100% - Year end
  endyear: [
    "Reflect on how far you've come.",
    "Every ending is a new beginning.",
    "You survived. You grew. You learned.",
    "Celebrate your wins, learn from the rest.",
    "New year, new possibilities await.",
    "What's done is done. What's next is yours.",
    "Close this chapter with pride.",
  ],
};

const getQuoteForProgress = (percentage: number, dayOfYear: number): string => {
  let range: string;
  
  if (percentage < 10) range = 'early';
  else if (percentage < 25) range = 'momentum';
  else if (percentage < 50) range = 'quarter';
  else if (percentage < 75) range = 'midyear';
  else if (percentage < 90) range = 'final';
  else range = 'endyear';
  
  const quotes = QUOTES_BY_RANGE[range];
  // Use day of year to pick a quote (changes daily)
  const quoteIndex = dayOfYear % quotes.length;
  return quotes[quoteIndex];
};

const calculateYearProgress = (): TimeData => {
  const now = new Date();
  const pakistanTime = new Date(now.toLocaleString('en-US', { timeZone: PAKISTAN_TIMEZONE }));
  
  const year = pakistanTime.getFullYear();
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  const startOfNextYear = new Date(year + 1, 0, 1, 0, 0, 0, 0);
  
  const totalMillisInYear = startOfNextYear.getTime() - startOfYear.getTime();
  const elapsedMillis = pakistanTime.getTime() - startOfYear.getTime();
  const percentage = (elapsedMillis / totalMillisInYear) * 100;
  
  // Calculate day of year
  const dayOfYear = Math.floor(elapsedMillis / (1000 * 60 * 60 * 24)) + 1;
  
  const formattedDate = pakistanTime.toLocaleString('en-US', {
    timeZone: PAKISTAN_TIMEZONE,
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    percentage: Math.round(percentage * 100) / 100,
    year,
    formattedDate,
    dayOfYear
  };
};

const Sparkle = ({ particle }: { particle: Particle }) => (
  <div
    className="sparkle absolute rounded-full bg-primary"
    style={{
      left: `${particle.left}%`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      animationDelay: `${particle.delay}s`,
      animationDuration: `${particle.duration}s`,
    }}
  />
);

const YearProgress = () => {
  const [timeData, setTimeData] = useState<TimeData>(calculateYearProgress);
  
  const particles = useMemo<Particle[]>(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    })), []
  );
  
  const quote = useMemo(() => 
    getQuoteForProgress(timeData.percentage, timeData.dayOfYear),
    [timeData.dayOfYear, timeData.percentage]
  );
  
  useEffect(() => {
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
        
        {/* Progress bar with particles */}
        <div className="w-full pt-4">
          <div className="progress-bar-wrapper">
            <div className="particles-container">
              {particles.map((particle) => (
                <Sparkle key={particle.id} particle={particle} />
              ))}
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${timeData.percentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Motivational quote */}
        <div className="text-center pt-2">
          <p className="text-base sm:text-lg text-accent-foreground/90 italic font-light leading-relaxed">
            "{quote}"
          </p>
        </div>
        
        {/* Current date and time */}
        <div className="text-center pt-4">
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
