"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  addYears,
  addMonths,
  addDays,
  addHours,
  addMinutes,
  isValid,
  parse,
  isFuture,
  getDaysInMonth,
} from "date-fns";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming shadcn setup includes this utility
import { Button, buttonVariants } from "@/components/ui/button"; // Assuming Button is in ui folder
import { Input } from "@/components/ui/input"; // Assuming Input is in ui folder
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming Card is in ui folder
import { Label } from "@/components/ui/label"; // Assuming Label is in ui folder
import Head from "next/head"; // Import Head for font link
import Confetti from "react-confetti"; // Import confetti
import useWindowSize from "react-use/lib/useWindowSize"; // Hook for confetti dimensions

// Define the structure for the calculated age
interface Age {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Define the structure for input errors
interface InputErrors {
  day?: string;
  month?: string;
  year?: string;
  general?: string;
}

export default function AgeCalculatorPage() {
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [age, setAge] = useState<Age | null>(null);
  const previousAgeRef = useRef<Age | null>(null); // Ref to store previous age
  const [errors, setErrors] = useState<InputErrors>({});
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const { width, height } = useWindowSize(); // Get window size for confetti

  // Function to calculate precise age including time
  const calculatePreciseAge = useCallback((dob: Date): Age => {
    const now = new Date();

    let years = differenceInYears(now, dob);
    const dateAfterYears = addYears(dob, years);

    let months = differenceInMonths(now, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);

    let days = differenceInDays(now, dateAfterMonths);
    const dateAfterDays = addDays(dateAfterMonths, days);

    let hours = differenceInHours(now, dateAfterDays);
    const dateAfterHours = addHours(dateAfterDays, hours);

    let minutes = differenceInMinutes(now, dateAfterHours);
    const dateAfterMinutes = addMinutes(dateAfterHours, minutes);

    let seconds = differenceInSeconds(now, dateAfterMinutes);

    // Simple boundary adjustments
    if (seconds < 0) {
      minutes--;
      seconds += 60;
    }
    if (minutes < 0) {
      hours--;
      minutes += 60;
    }
    if (hours < 0) {
      days--;
      hours += 24;
    }
    if (days < 0) {
      months--;
      // Ensure dob exists before using it here
      if (dob) {
        const daysInPrevMonth = getDaysInMonth(addMonths(dateAfterMonths, -1));
        days += daysInPrevMonth;
      } else {
        days = 0; // Fallback if dob is somehow null
      }
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // Ensure non-negative results
    years = Math.max(0, years);
    months = Math.max(0, months);
    days = Math.max(0, days);
    hours = Math.max(0, hours);
    minutes = Math.max(0, minutes);
    seconds = Math.max(0, seconds);

    return { years, months, days, hours, minutes, seconds };
  }, []);

  // Effect to update age every second and check for birthday
  useEffect(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    if (birthDate) {
      const updateAge = () => {
        const currentAge = calculatePreciseAge(birthDate);
        setAge(currentAge);

        // Check if the year has incremented (Birthday check)
        const previousAge = previousAgeRef.current;
        if (previousAge && currentAge.years > previousAge.years) {
          console.log("Happy Birthday!"); // Log for debugging
          setShowConfetti(true);
          setRecycleConfetti(true); // Start confetti
          // Stop confetti after some time
          setTimeout(() => {
            setRecycleConfetti(false); // Tell confetti to stop recycling particles
          }, 8000); // Confetti runs for 8 seconds
          // Optionally hide component fully after animation ends (recycle false + ~2s)
          setTimeout(() => {
            setShowConfetti(false);
          }, 10000);
        }
        // Update previous age ref
        previousAgeRef.current = currentAge;
      };

      updateAge(); // Initial calculation
      const id = setInterval(updateAge, 1000); // Update every second
      setIntervalId(id);
    } else {
      setAge(null); // Clear age if no birthdate
      previousAgeRef.current = null; // Clear previous age
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate, calculatePreciseAge]); // Rerun when birthDate changes

  const validateAndSetBirthDate = () => {
    const currentErrors: InputErrors = {};
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear();

    currentErrors.general = undefined;

    if (!day) currentErrors.day = "This field is required";
    else if (isNaN(dayNum) || dayNum < 1 || dayNum > 31)
      currentErrors.day = "Must be a valid day";

    if (!month) currentErrors.month = "This field is required";
    else if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
      currentErrors.month = "Must be a valid month";

    if (!year) currentErrors.year = "This field is required";
    else if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear)
      currentErrors.year = `Must be between 1900-${currentYear}`;

    if (Object.values(currentErrors).some((err) => err !== undefined)) {
      setErrors(currentErrors);
      setBirthDate(null);
      return;
    }

    const daysInSelectedMonth = getDaysInMonth(new Date(yearNum, monthNum - 1));
    if (dayNum > daysInSelectedMonth) {
      currentErrors.day = `Must be a valid date`;
      currentErrors.month = " ";
      currentErrors.year = " ";
      currentErrors.general = `Invalid date combination.`;
    } else {
      const dateString = `${yearNum}-${String(monthNum).padStart(
        2,
        "0"
      )}-${String(dayNum).padStart(2, "0")}`;
      const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
      parsedDate.setHours(0, 0, 0, 0);

      if (!isValid(parsedDate)) {
        currentErrors.general = "The entered date is invalid.";
      } else if (isFuture(parsedDate)) {
        currentErrors.general = "Birth date must be in the past.";
        currentErrors.day = " ";
        currentErrors.month = " ";
        currentErrors.year = " ";
      } else {
        setBirthDate(parsedDate);
        setErrors({});
        // Reset confetti state if a new valid date is set
        setShowConfetti(false);
        setRecycleConfetti(true);
        previousAgeRef.current = null; // Reset previous age for new calculation
        return;
      }
    }

    setErrors(currentErrors);
    setBirthDate(null);
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  // Apply grid background and font effect
  useEffect(() => {
    document.body.classList.add("font-poppins");
    document.body.style.backgroundColor = "var(--background)";
    document.body.style.backgroundImage = `
      linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
    `;
    document.body.style.backgroundSize = "40px 40px";

    const gridLineColorLight = "rgba(0, 0, 0, 0.05)";
    const gridLineColorDark = "rgba(255, 255, 255, 0.07)";
    const backgroundColorLight = "#f8fafc"; // slate-50
    const backgroundColorDark = "#020617"; // slate-950

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.style.setProperty(
      "--grid-line",
      prefersDark ? gridLineColorDark : gridLineColorLight
    );
    document.documentElement.style.setProperty(
      "--background",
      prefersDark ? backgroundColorDark : backgroundColorLight
    );

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.style.setProperty(
        "--grid-line",
        e.matches ? gridLineColorDark : gridLineColorLight
      );
      document.documentElement.style.setProperty(
        "--background",
        e.matches ? backgroundColorDark : backgroundColorLight
      );
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      document.body.classList.remove("font-poppins");
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Define card background styles
  const cardGridLineLight = "rgba(0, 0, 0, 0.06)";
  const cardGridLineDark = "rgba(255, 255, 255, 0.06)";
  // Determine current card grid line color based on theme preference
  // Note: This won't dynamically update if theme changes *while* component is mounted without extra logic
  const cardGridLine =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? cardGridLineDark
      : cardGridLineLight;

  const cardStyle = {
    backgroundImage: `
      linear-gradient(to right, ${cardGridLine} 1px, transparent 1px),
      linear-gradient(to bottom, ${cardGridLine} 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
  };

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <title>Age Calculator</title>
      </Head>

      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={recycleConfetti}
          numberOfPieces={300}
          gravity={0.15}
        />
      )}

      <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-6 font-poppins overflow-hidden">
        {" "}
        {/* Added overflow-hidden for confetti */}
        {/* GitHub Link Button */}
        <a
          href="https://github.com/your-username/your-repo" // Replace with your actual repo URL
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "absolute top-4 right-4 transition-transform duration-200 ease-in-out hover:scale-110 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 z-20 rounded-full" // Increased z-index
          )}
          aria-label="View source code on GitHub"
        >
          <Github className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </a>
        <Card
          className="w-full max-w-xl shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 rounded-2xl relative z-10" // Added z-10
          style={cardStyle} // Apply grid background style to card
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-50">
              Age Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 space-y-4 sm:space-y-0 mb-6">
              {/* Input Fields */}
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="day"
                  className={cn(
                    "font-medium text-xs tracking-wider uppercase",
                    errors.day || errors.general
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Day
                </Label>
                <Input
                  id="day"
                  type="number"
                  placeholder="DD"
                  value={day}
                  onChange={handleInputChange(setDay)}
                  min="1"
                  max="31"
                  className={cn(
                    "text-xl font-semibold h-12 dark:bg-gray-700/50 dark:text-gray-100 focus:border-purple-500 focus:ring-purple-500",
                    errors.day || errors.general
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                />
                {errors.day && errors.day !== " " && (
                  <p className="text-xs text-red-500 dark:text-red-400 pt-1 italic">
                    {errors.day}
                  </p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="month"
                  className={cn(
                    "font-medium text-xs tracking-wider uppercase",
                    errors.month || errors.general
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Month
                </Label>
                <Input
                  id="month"
                  type="number"
                  placeholder="MM"
                  value={month}
                  onChange={handleInputChange(setMonth)}
                  min="1"
                  max="12"
                  className={cn(
                    "text-xl font-semibold h-12 dark:bg-gray-700/50 dark:text-gray-100 focus:border-purple-500 focus:ring-purple-500",
                    errors.month || errors.general
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                />
                {errors.month && errors.month !== " " && (
                  <p className="text-xs text-red-500 dark:text-red-400 pt-1 italic">
                    {errors.month}
                  </p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="year"
                  className={cn(
                    "font-medium text-xs tracking-wider uppercase",
                    errors.year || errors.general
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="YYYY"
                  value={year}
                  onChange={handleInputChange(setYear)}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={cn(
                    "text-xl font-semibold h-12 dark:bg-gray-700/50 dark:text-gray-100 focus:border-purple-500 focus:ring-purple-500",
                    errors.year || errors.general
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                />
                {errors.year && errors.year !== " " && (
                  <p className="text-xs text-red-500 dark:text-red-400 pt-1 italic">
                    {errors.year}
                  </p>
                )}
              </div>
            </div>
            {errors.general && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center pb-4 italic">
                {errors.general}
              </p>
            )}

            {/* Divider and Button */}
            <div className="relative flex items-center my-6 sm:my-2">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <div className="flex-shrink-0 mx-[-1px]">
                <Button
                  onClick={validateAndSetBirthDate}
                  size="icon"
                  aria-label="Calculate Age"
                  className="rounded-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white w-16 h-16 sm:w-20 sm:h-20 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-down"
                  >
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Results Display */}
            <div className="pt-6 pb-8 space-y-1 italic">
              {age ? (
                <>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      {age.years}
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      years
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      {age.months}
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      months
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      {age.days}
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      days
                    </span>
                  </div>
                  <div className="pt-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base not-italic font-mono">
                    {String(age.hours).padStart(2, "0")}:
                    {String(age.minutes).padStart(2, "0")}:
                    {String(age.seconds).padStart(2, "0")}
                    <span className="ml-1 text-xs">(hh:mm:ss)</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Placeholder dashes */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      --
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      years
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      --
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      months
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-600 dark:text-purple-400">
                      --
                    </span>
                    <span className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-200">
                      days
                    </span>
                  </div>
                  <div className="pt-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base not-italic font-mono">
                    --:--:--
                    <span className="ml-1 text-xs">(hh:mm:ss)</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// NOTE: Ensure you have shadcn/ui properly installed and configured.
// Install dependencies: npm install date-fns lucide-react react-confetti react-use @types/react-confetti
// Ensure Tailwind CSS is configured for the 'Poppins' font.
