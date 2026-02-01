import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAKISTAN_TIMEZONE = 'Asia/Karachi';

interface TimeData {
  percentage: number;
  year: number;
  formattedDate: string;
  dayOfYear: number;
  nextMilestone: { target: number; days: number; hours: number; minutes: number; seconds: number };
  nextMonth: { name: string; days: number; hours: number; minutes: number; seconds: number };
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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'];

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
  
  // Calculate next 5% milestone
  const nextMilestonePercent = Math.ceil(percentage / 5) * 5;
  const targetMilestone = nextMilestonePercent > 100 ? 100 : nextMilestonePercent;
  const millisToMilestone = (targetMilestone / 100) * totalMillisInYear - elapsedMillis;
  const milestoneCountdown = formatCountdown(millisToMilestone);
  
  // Calculate next month
  const currentMonth = pakistanTime.getMonth();
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? year + 1 : year;
  const nextMonthStart = new Date(nextMonthYear, nextMonthIndex, 1, 0, 0, 0, 0);
  const millisToNextMonth = nextMonthStart.getTime() - pakistanTime.getTime();
  const monthCountdown = formatCountdown(millisToNextMonth);
  
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
    dayOfYear,
    nextMilestone: { target: targetMilestone, ...milestoneCountdown },
    nextMonth: { name: MONTH_NAMES[nextMonthIndex], ...monthCountdown }
  };
};

const formatCountdown = (millis: number) => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
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
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
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

  const captureImage = useCallback(async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Failed to capture image:', error);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    
    try {
      const blob = await captureImage();
      if (!blob) throw new Error('Failed to capture image');
      
      const file = new File([blob], `year-progress-${timeData.year}.png`, { type: 'image/png' });
      
      // Try native share API first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${timeData.percentage.toFixed(2)}% of ${timeData.year}`,
          text: `${timeData.percentage.toFixed(2)}% of ${timeData.year} has passed. "${quote}"`,
          files: [file],
        });
        setShareSuccess(true);
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `year-progress-${timeData.year}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareSuccess(true);
      }
      
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsSharing(false);
    }
  }, [captureImage, timeData.year, timeData.percentage, quote]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div ref={contentRef} className="w-full max-w-md space-y-8 p-6 rounded-xl" style={{ backgroundColor: '#000' }}>
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
          <p className="text-base sm:text-lg text-foreground/90 italic font-light leading-relaxed">
            "{quote}"
          </p>
        </div>
        
        {/* Countdown timers */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          {/* Next 5% milestone */}
          <div className="countdown-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Next {timeData.nextMilestone.target}%
            </p>
            <div className="countdown-time">
              {timeData.nextMilestone.days > 0 && (
                <span>{timeData.nextMilestone.days}<span className="countdown-unit">d</span> </span>
              )}
              <span>{String(timeData.nextMilestone.hours).padStart(2, '0')}<span className="countdown-unit">h</span> </span>
              <span>{String(timeData.nextMilestone.minutes).padStart(2, '0')}<span className="countdown-unit">m</span> </span>
              <span>{String(timeData.nextMilestone.seconds).padStart(2, '0')}<span className="countdown-unit">s</span></span>
            </div>
          </div>
          
          {/* Next month */}
          <div className="countdown-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {timeData.nextMonth.name}
            </p>
            <div className="countdown-time">
              {timeData.nextMonth.days > 0 && (
                <span>{timeData.nextMonth.days}<span className="countdown-unit">d</span> </span>
              )}
              <span>{String(timeData.nextMonth.hours).padStart(2, '0')}<span className="countdown-unit">h</span> </span>
              <span>{String(timeData.nextMonth.minutes).padStart(2, '0')}<span className="countdown-unit">m</span> </span>
              <span>{String(timeData.nextMonth.seconds).padStart(2, '0')}<span className="countdown-unit">s</span></span>
            </div>
          </div>
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
        
        {/* Share button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleShare}
            disabled={isSharing}
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            {shareSuccess ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary">Saved!</span>
              </>
            ) : isSharing ? (
              <>
                <Download className="h-4 w-4 animate-pulse" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share Progress</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YearProgress;
