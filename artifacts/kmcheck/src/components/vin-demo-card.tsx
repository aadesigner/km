import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Gauge, Fingerprint, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { DemoCarPhoto, preloadDemoCarPhotos } from "@/components/demo-car-photo";
import { FlagImg } from "@/components/flag-img";
import { demoCarPhotoUrl } from "@/lib/demo-car-photos";

export interface DemoCar {
  vin: string;
  name: string;
  year: number;
  origin: "USA" | "Korea" | "Germany" | "China" | "UAE";
  flagImg: string;
  photo: string;
  score: number;
  mileage: number;
  unit: "mi" | "km";
  accidents: number;
  owners: number;
  salvage: boolean;
  stolen: boolean;
  condition: "CLEAN" | "CAUTION" | "RISK";
}

// Photos: JPEGs in public/demo-cars (served as /demo-cars/*; refreshed on build).
// Manual refresh: node artifacts/kmcheck/scripts/fetch-demo-car-photos.mjs
export const ALL_CARS: DemoCar[] = [
  /* Korea */
  {
    vin: "KM8R3DGE3PU812456",
    name: "Hyundai Tucson",
    year: 2023,
    origin: "Korea",
    flagImg: "kr",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("hyundai-tucson.jpg"),
    score: 9.6,
    mileage: 24_800,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "KNAE251D5M6129044",
    name: "Kia K8",
    year: 2022,
    origin: "Korea",
    flagImg: "kr",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("kia-k8.jpg"),
    score: 9.3,
    mileage: 41_200,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "KNDPM3AC9K7583241",
    name: "Kia Sportage",
    year: 2019,
    origin: "Korea",
    flagImg: "kr",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("kia-sportage.jpg"),
    score: 6.4,
    mileage: 138_600,
    accidents: 2,
    owners: 3,
    salvage: false,
    stolen: false,
  },
  {
    vin: "KMHEC41CBGA156782",
    name: "Hyundai Grandeur",
    year: 2017,
    origin: "Korea",
    flagImg: "kr",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("hyundai-grandeur.jpg"),
    score: 5.9,
    mileage: 192_400,
    accidents: 1,
    owners: 4,
    salvage: false,
    stolen: false,
  },
  {
    vin: "KNAE251D5J6038429",
    name: "Kia Carnival",
    year: 2016,
    origin: "Korea",
    flagImg: "kr",
    unit: "km",
    condition: "RISK",
    photo: demoCarPhotoUrl("kia-carnival.jpg"),
    score: 3.4,
    mileage: 264_000,
    accidents: 3,
    owners: 5,
    salvage: true,
    stolen: false,
  },

  /* USA */
  {
    vin: "2T3P1RFV8NW214892",
    name: "Toyota RAV4",
    year: 2022,
    origin: "USA",
    flagImg: "us",
    unit: "mi",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("toyota-rav4.jpg"),
    score: 9.5,
    mileage: 19_400,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "7FARS4H49NE038214",
    name: "Honda CR-V",
    year: 2021,
    origin: "USA",
    flagImg: "us",
    unit: "mi",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("honda-crv.jpg"),
    score: 9.1,
    mileage: 32_800,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "1FTEW1E50JKF08392",
    name: "Ford F-150",
    year: 2018,
    origin: "USA",
    flagImg: "us",
    unit: "mi",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("ford-f150.jpg"),
    score: 6.7,
    mileage: 118_200,
    accidents: 2,
    owners: 3,
    salvage: false,
    stolen: false,
  },
  {
    vin: "1N4AL3AP8JC142876",
    name: "Nissan Altima",
    year: 2017,
    origin: "USA",
    flagImg: "us",
    unit: "mi",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("nissan-altima.jpg"),
    score: 6.1,
    mileage: 97_500,
    accidents: 1,
    owners: 4,
    salvage: false,
    stolen: false,
  },
  {
    vin: "1G11C5SL4EF287341",
    name: "Chevrolet Malibu",
    year: 2014,
    origin: "USA",
    flagImg: "us",
    unit: "mi",
    condition: "RISK",
    photo: demoCarPhotoUrl("chevy-malibu.jpg"),
    score: 3.1,
    mileage: 156_800,
    accidents: 3,
    owners: 4,
    salvage: true,
    stolen: false,
  },

  /* Germany — popular imports */
  {
    vin: "WBA8E9G50MNU51284",
    name: "BMW 320i",
    year: 2021,
    origin: "Germany",
    flagImg: "de",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("bmw-320i.jpg"),
    score: 9.2,
    mileage: 38_400,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "WDDWF4HB9KR284719",
    name: "Mercedes-Benz C 220d",
    year: 2019,
    origin: "Germany",
    flagImg: "de",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("mercedes-c-class.jpg"),
    score: 6.8,
    mileage: 112_500,
    accidents: 1,
    owners: 2,
    salvage: false,
    stolen: false,
  },
  {
    vin: "WVWZZZ5NZJW847291",
    name: "Volkswagen Tiguan",
    year: 2018,
    origin: "Germany",
    flagImg: "de",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("vw-tiguan.jpg"),
    score: 6.2,
    mileage: 146_800,
    accidents: 1,
    owners: 3,
    salvage: false,
    stolen: false,
  },

  /* China — domestic EVs */
  {
    vin: "LFVVB9E75N3012847",
    name: "BYD Han EV",
    year: 2023,
    origin: "China",
    flagImg: "cn",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("byd-han-ev.jpg"),
    score: 9.4,
    mileage: 18_600,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "LJNBBABA5PA012847",
    name: "NIO ET5",
    year: 2022,
    origin: "China",
    flagImg: "cn",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("nio-et5.jpg"),
    score: 9.1,
    mileage: 32_400,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "LC0C76C49R0123456",
    name: "BYD Seal",
    year: 2023,
    origin: "China",
    flagImg: "cn",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("byd-seal.jpg"),
    score: 6.6,
    mileage: 54_200,
    accidents: 1,
    owners: 2,
    salvage: false,
    stolen: false,
  },
  {
    vin: "LXPV2A4C8MA012345",
    name: "XPeng P7",
    year: 2021,
    origin: "China",
    flagImg: "cn",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("xpeng-p7.jpg"),
    score: 6.2,
    mileage: 78_900,
    accidents: 1,
    owners: 3,
    salvage: false,
    stolen: false,
  },
  {
    vin: "L6T79T2E3ND012345",
    name: "Zeekr 001",
    year: 2022,
    origin: "China",
    flagImg: "cn",
    unit: "km",
    condition: "RISK",
    photo: demoCarPhotoUrl("zeekr-001.jpg"),
    score: 3.6,
    mileage: 112_000,
    accidents: 2,
    owners: 4,
    salvage: true,
    stolen: false,
  },

  /* UAE — luxury imports */
  {
    vin: "WUAZZZFX7LN012345",
    name: "Audi R8",
    year: 2020,
    origin: "UAE",
    flagImg: "ae",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("audi-r8.jpg"),
    score: 9.5,
    mileage: 22_400,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "WP0AB2A99KS712345",
    name: "Porsche 911 Carrera",
    year: 2019,
    origin: "UAE",
    flagImg: "ae",
    unit: "km",
    condition: "CLEAN",
    photo: demoCarPhotoUrl("porsche-911.jpg"),
    score: 9.2,
    mileage: 31_800,
    accidents: 0,
    owners: 1,
    salvage: false,
    stolen: false,
  },
  {
    vin: "ZFF80AMA0J0234567",
    name: "Ferrari 488 GTB",
    year: 2017,
    origin: "UAE",
    flagImg: "ae",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("ferrari-488.jpg"),
    score: 6.5,
    mileage: 48_600,
    accidents: 1,
    owners: 2,
    salvage: false,
    stolen: false,
  },
  {
    vin: "ZHWUT5ZF4KLA01234",
    name: "Lamborghini Huracán",
    year: 2018,
    origin: "UAE",
    flagImg: "ae",
    unit: "km",
    condition: "CAUTION",
    photo: demoCarPhotoUrl("lamborghini-huracan.jpg"),
    score: 6.0,
    mileage: 36_200,
    accidents: 1,
    owners: 2,
    salvage: false,
    stolen: false,
  },
  {
    vin: "WDDWJ6EB5KA012345",
    name: "Mercedes-AMG GT",
    year: 2019,
    origin: "UAE",
    flagImg: "ae",
    unit: "km",
    condition: "RISK",
    photo: demoCarPhotoUrl("mercedes-amg-gt.jpg"),
    score: 3.2,
    mileage: 89_500,
    accidents: 2,
    owners: 3,
    salvage: true,
    stolen: false,
  },
];

const CONDITION_LABEL_KEYS: Record<DemoCar["condition"], string> = {
  CLEAN: "report_clean",
  CAUTION: "report_caution",
  RISK: "report_risk",
};

const COND = {
  CLEAN: {
    scoreColor:  "text-emerald-500 dark:text-emerald-400",
    barColor:    "bg-primary",
    badge:       "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15 dark:border-primary/25",
    accentBar:   "from-primary via-primary/50 to-transparent",
    lightGlow:   "shadow-[0_8px_40px_rgba(34,197,94,0.12)]",
    darkGlow:    "dark:shadow-[0_8px_40px_rgba(34,197,94,0.22)]",
    okColor:     "text-emerald-600 dark:text-primary",
  },
  CAUTION: {
    scoreColor:  "text-amber-500 dark:text-amber-400",
    barColor:    "bg-amber-500",
    badge:       "bg-amber-500/10 text-amber-600 border border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    accentBar:   "from-amber-500 via-amber-400/50 to-transparent",
    lightGlow:   "shadow-[0_8px_40px_rgba(245,158,11,0.10)]",
    darkGlow:    "dark:shadow-[0_8px_40px_rgba(251,191,36,0.16)]",
    okColor:     "text-emerald-600 dark:text-primary",
  },
  RISK: {
    scoreColor:  "text-red-500 dark:text-red-400",
    barColor:    "bg-red-500",
    badge:       "bg-red-500/10 text-red-600 border border-red-400/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
    accentBar:   "from-red-500 via-red-400/40 to-transparent",
    lightGlow:   "shadow-[0_8px_40px_rgba(239,68,68,0.10)]",
    darkGlow:    "dark:shadow-[0_8px_40px_rgba(248,113,113,0.18)]",
    okColor:     "text-emerald-600 dark:text-primary",
  },
};

function milColor(pct: number) {
  return pct > 70 ? "bg-red-500" : pct > 40 ? "bg-amber-500" : "bg-primary";
}
function milTextColor(pct: number) {
  return pct > 70
    ? "text-red-600 dark:text-red-400"
    : pct > 40
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-primary";
}
function truncVin(vin: string) {
  return `${vin.slice(0, 8)}···${vin.slice(-4)}`;
}

function carsForCountry(country?: "usa" | "korea" | "canada" | "china" | "uae"): DemoCar[] {
  if (!country) return ALL_CARS;
  if (country === "korea") {
    return ALL_CARS.filter((c) => c.origin === "Korea" || c.origin === "Germany");
  }
  if (country === "canada") {
    return ALL_CARS.filter((c) => c.origin === "USA" || c.origin === "Germany");
  }
  if (country === "china") {
    return ALL_CARS.filter((c) => c.origin === "China");
  }
  if (country === "uae") {
    return ALL_CARS.filter((c) => c.origin === "UAE");
  }
  return ALL_CARS.filter((c) => c.origin === "USA");
}

function demoCardSubtitle(car: DemoCar, t: (key: string) => string): string {
  const originKey =
    car.origin === "Korea"
      ? "demo_card_origin_korea"
      : car.origin === "Germany"
        ? "demo_card_origin_germany"
        : car.origin === "China"
          ? "demo_card_origin_china"
          : car.origin === "UAE"
            ? "demo_card_origin_uae"
            : "demo_card_origin_usa";
  return t(originKey);
}

function demoCarMakeModel(car: DemoCar): { make: string; model: string } {
  const splitAt = car.name.indexOf(" ");
  if (splitAt === -1) return { make: car.name, model: "" };
  return {
    make: car.name.slice(0, splitAt),
    model: car.name.slice(splitAt + 1),
  };
}

const LBL = "text-[12px] font-medium text-muted-foreground dark:text-white/40";
const ICO = "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 dark:text-white/25";

function DemoCardShowcase({
  children,
  accentClass,
  condition,
  wide = false,
  flat = false,
}: {
  children: React.ReactNode;
  accentClass: string;
  condition: DemoCar["condition"];
  wide?: boolean;
  /** Flat mode — minimal tilt, no hover depth (legacy) */
  flat?: boolean;
}) {
  const { dir } = useTranslation();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const isRtl = dir === "rtl";
  /** Country hero — subtle text-facing tilt without thick edge / heavy shadows */
  const countryFace = wide && flat;
  /** Pivot from inner edge; card faces the hero / text column. */
  const transformOrigin = isRtl ? "100% 50%" : "0% 50%";
  const baseRotateY = countryFace
    ? isRtl ? 9 : -9
    : isRtl ? (wide ? 22 : 14) : wide ? -22 : -14;
  const baseRotateX = countryFace ? 2 : wide ? 6 : 4;
  const depthZ = countryFace ? 0 : wide ? 36 : 18;
  const edgeDepthZ = wide ? -20 : -14;
  const [tilt, setTilt] = useState({ x: baseRotateX, y: baseRotateY });

  const conditionGlow = {
    CLEAN: "from-emerald-500/35 via-primary/12",
    CAUTION: "from-amber-500/30 via-amber-500/8",
    RISK: "from-red-500/30 via-red-500/8",
  }[condition];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const resetTilt = useCallback(() => {
    setTilt({ x: baseRotateX, y: baseRotateY });
  }, [baseRotateX, baseRotateY]);

  useEffect(() => {
    resetTilt();
  }, [resetTilt, isRtl]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceMotion || !isDesktop || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: baseRotateX - py * (countryFace ? 1.6 : wide ? 2.8 : 2.2),
      y: baseRotateY + px * (countryFace ? 2.4 : wide ? 4 : 3.2),
    });
  };

  const cardShadow = countryFace
    ? ""
    : flat
    ? "shadow-md shadow-black/8 dark:shadow-black/30"
    : !isDesktop
      ? "shadow-2xl shadow-black/15 dark:shadow-black/40"
      : wide
        ? "shadow-[0_24px_48px_-22px_rgba(0,0,0,0.17)] dark:shadow-[0_28px_52px_-20px_rgba(0,0,0,0.4)]"
        : isRtl
          ? "shadow-[-18px_24px_44px_-18px_rgba(0,0,0,0.32)] dark:shadow-[-20px_28px_50px_-16px_rgba(0,0,0,0.6)]"
          : "shadow-[18px_24px_44px_-18px_rgba(0,0,0,0.32)] dark:shadow-[20px_28px_50px_-16px_rgba(0,0,0,0.6)]";

  const cardTransform = isDesktop && (!flat || countryFace)
    ? depthZ > 0
      ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${depthZ}px)`
      : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : isDesktop && flat
      ? `rotateY(${isRtl ? 4 : -4}deg) rotateX(1deg)`
      : `rotateY(${isRtl ? 6 : -6}deg) rotateX(2deg)`;

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative w-full min-w-0 mx-auto lg:mx-0 lg:ms-auto",
        flat
          ? "pt-1 pb-0 w-full max-w-[min(100%,380px)]"
          : cn("py-1 md:py-2 lg:py-3", wide && "pb-6 lg:pb-8"),
        wide && !flat ? "max-w-[min(100%,420px)]" : !flat ? "max-w-[min(100%,320px)]" : "",
      )}
      style={
        flat && !countryFace
          ? undefined
          : {
              perspective: countryFace ? "1400px" : wide ? "1100px" : "1600px",
              perspectiveOrigin: countryFace || wide
                ? isRtl ? "78% 42%" : "22% 42%"
                : isRtl ? "65% 42%" : "35% 42%",
            }
      }
      onPointerMove={flat && !countryFace ? undefined : onPointerMove}
      onPointerLeave={flat && !countryFace ? undefined : resetTilt}
    >
      {!flat && (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-8 -z-20 rounded-[2rem] blur-3xl",
          "bg-gradient-to-br to-transparent",
          conditionGlow,
          wide ? "opacity-35" : "opacity-50",
        )}
      />
      )}

      {/* Floor reflection */}
      {!flat && (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-[100%] blur-2xl -z-10",
          wide ? "bottom-0 h-12 w-[68%] opacity-40" : "-bottom-3 h-14 w-[76%] opacity-60",
          isRtl ? "right-[14%] bg-primary/12" : "left-[14%] bg-primary/12",
        )}
        style={{ transform: "rotateX(78deg) scaleY(0.45)" }}
      />
      )}

      <motion.div
        className="relative w-full [transform-style:preserve-3d]"
        animate={reduceMotion || !isDesktop || (flat && !countryFace) ? undefined : { y: [0, -5, 0] }}
        transition={
          reduceMotion || !isDesktop || (flat && !countryFace)
            ? undefined
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div
          className={cn(
            "relative w-full [transform-style:preserve-3d]",
            isDesktop && (!flat || countryFace) && "transition-transform duration-300 ease-out",
          )}
          style={{
            transformOrigin,
            transform: cardTransform,
          }}
        >
          {/* Card thickness — outer edge depth (homepage cards only) */}
          {isDesktop && !flat && !countryFace && (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-3 bottom-3 rounded-sm hidden md:block",
                wide ? "w-3" : "w-2.5 top-4 bottom-4",
                isRtl
                  ? "-left-2.5 bg-gradient-to-l from-black/35 via-black/18 to-black/8 dark:from-black/60 dark:via-black/30 dark:to-black/15"
                  : "-right-2.5 bg-gradient-to-r from-black/35 via-black/18 to-black/8 dark:from-black/60 dark:via-black/30 dark:to-black/15",
              )}
              style={{ transform: `translateZ(${edgeDepthZ}px)` }}
            />
          )}

          {isDesktop && !flat && wide && !countryFace && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl hidden md:block bg-black/[0.06] dark:bg-black/30 border border-black/10 dark:border-white/5"
              style={{ transform: "translateZ(-10px)" }}
            />
          )}

          {!flat && !countryFace && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute hidden md:block -z-20 rounded-[100%] blur-xl",
              wide ? "-bottom-4 h-6 w-[72%] opacity-35" : "-bottom-5 h-8 w-[90%]",
              isRtl ? "right-[8%] bg-black/20 dark:bg-black/35" : "left-[8%] bg-black/20 dark:bg-black/35",
            )}
            style={{ transform: "rotateX(82deg) scaleY(0.5)" }}
          />
          )}

          <div
            className={cn(
              "relative rounded-2xl overflow-hidden [transform-style:preserve-3d]",
              countryFace
                ? "border border-border/60 bg-background shadow-none"
                : cn(
                  "border border-white/30 dark:border-white/12",
                  "bg-white dark:bg-[#0d1117]",
                  flat ? cardShadow : cn(cardShadow, !wide && accentClass),
                ),
            )}
          >
            {isDesktop && !flat && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 w-[2px] hidden md:block z-20",
                  isRtl
                    ? "right-0 bg-gradient-to-l from-white/25 to-transparent"
                    : "left-0 bg-gradient-to-r from-white/30 to-transparent",
                )}
              />
            )}
            {isDesktop && !flat && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden md:block z-10 rounded-2xl"
                style={{
                  background: countryFace
                    ? isRtl
                      ? "linear-gradient(225deg, rgba(255,255,255,0.08) 0%, transparent 40%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)"
                    : wide
                      ? isRtl
                        ? "linear-gradient(225deg, rgba(255,255,255,0.14) 0%, transparent 32%, transparent 68%, rgba(0,0,0,0.05) 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 32%, transparent 68%, rgba(0,0,0,0.05) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.04) 100%)",
                }}
              />
            )}
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function pickFrozenCar(pool: DemoCar[]): DemoCar {
  return pool.find((c) => c.condition === "CLEAN") ?? pool[0]!;
}

export function VinDemoCard({
  country,
  showcase = false,
  frozen = false,
  heroSide = false,
}: {
  country?: "usa" | "korea" | "canada" | "china" | "uae";
  showcase?: boolean;
  /** Single static preview — no carousel, transitions, or dot nav. */
  frozen?: boolean;
  /** Homepage hero flanks — larger layout beside the VIN form. */
  heroSide?: boolean;
}) {
  const { t } = useTranslation();
  const pool = useMemo(() => carsForCountry(country), [country]);
  const cars = frozen ? [pickFrozenCar(pool)] : pool;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx((i) => (cars.length === 0 ? 0 : i % cars.length));
  }, [cars.length]);

  useEffect(() => {
    if (frozen || cars.length === 0) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % cars.length), 5000);
    return () => clearInterval(timer);
  }, [cars.length, frozen]);

  useEffect(() => {
    if (cars.length === 0) return;
    const urls = frozen
      ? [cars[0]!.photo]
      : [
          cars[idx]?.photo,
          cars[(idx + 1) % cars.length]?.photo,
        ].filter((u): u is string => Boolean(u));
    preloadDemoCarPhotos(urls);
  }, [cars, frozen, idx]);

  const car = cars[idx] ?? cars[0];
  if (!car) return null;
  const displayFlag = country === "canada" && car.origin === "USA" ? "ca" : car.flagImg;
  const subtitle = demoCardSubtitle(car, t);
  const c = COND[car.condition];
  const compact = showcase && !heroSide;
  const rowClass = cn(
    compact ? "px-3 py-1.5" : "px-5 py-3",
    "flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] last:border-0",
  );
  const photoHeight = compact
    ? "h-32 sm:h-36 lg:h-40"
    : heroSide
      ? "h-48 lg:h-52"
      : "h-44";

  // US max = 200k mi → red above 140k mi (70%)
  // Korean max = 320k km → red above 224k km (70%)
  const maxMileage = car.unit === "mi" ? 200_000 : 320_000;
  const mileagePct = Math.min(100, Math.round((car.mileage / maxMileage) * 100));

  if (showcase && !heroSide) {
    const slideFlag =
      country === "canada" && car.origin === "USA" ? "ca" : car.flagImg;
    const { make, model } = demoCarMakeModel(car);

    return (
      <DemoCardShowcase wide flat accentClass="" condition={car.condition}>
        <div className="overflow-hidden rounded-2xl bg-background">
          <div className={cn("h-0.5 bg-gradient-to-r", c.accentBar)} />

          <div className="relative">
            <div className="relative h-36 overflow-hidden bg-muted/35">
              {cars.map((slideCar, slideIdx) => {
                const isActive = slideIdx === idx;
                const isNext = slideIdx === (idx + 1) % cars.length;
                return (
                  <div
                    key={slideCar.vin}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500 ease-out",
                      isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none",
                    )}
                    aria-hidden={!isActive}
                  >
                    <DemoCarPhoto
                      src={slideCar.photo}
                      alt={`${slideCar.year} ${slideCar.name}`}
                      eager={isActive || isNext}
                    />
                  </div>
                );
              })}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <AnimatePresence mode="wait">
                <div
                  key={car.vin + "-overlay"}
                  className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3"
                >
                  <div className="inline-flex items-center rounded-full bg-black/45 p-1.5 backdrop-blur-sm">
                    <FlagImg code={slideFlag} size={18} className="rounded-sm shadow-sm" />
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide backdrop-blur-sm",
                    c.badge,
                  )}>
                    {t(CONDITION_LABEL_KEYS[car.condition])}
                  </span>
                </div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <div
                  key={car.vin + "-hero"}
                  className="absolute inset-x-0 bottom-0 p-3"
                >
                  <div className="flex items-end justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white leading-tight truncate">
                        {car.year} {make}{model ? ` ${model}` : ""}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/60 truncate">
                        {subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 text-center backdrop-blur-sm">
                      <p className={cn("text-lg font-black tabular-nums leading-none", c.scoreColor)}>
                        {car.score.toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/55">
                        {t("demo_trust_score")}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatePresence>
            </div>

          <AnimatePresence mode="wait">
            <div key={car.vin + "-stats"}>
              <div className="grid grid-cols-3 gap-1 border-b border-border/60 bg-card/30 px-3 py-2">
                <div className="min-w-0 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{t("year")}</p>
                  <p className="mt-0.5 text-xs font-bold tabular-nums">{car.year}</p>
                </div>
                <div className="min-w-0 text-center border-x border-border/50 px-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{t("make")}</p>
                  <p className="mt-0.5 text-xs font-bold truncate" title={make}>{make}</p>
                </div>
                <div className="min-w-0 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{t("model")}</p>
                  <p className="mt-0.5 text-xs font-bold truncate" title={model || car.name}>{model || car.name}</p>
                </div>
              </div>

              <div className="border-b border-border/60 bg-muted/[0.15] px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Gauge className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("demo_odometer")}
                    </span>
                  </div>
                  <span className={cn("text-xs font-bold tabular-nums", milTextColor(mileagePct))}>
                    {car.mileage.toLocaleString()} {car.unit}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-black/[0.06] dark:bg-white/8 overflow-hidden">
                  <div
                    className={cn("h-1 rounded-full", milColor(mileagePct))}
                    style={{ width: `${mileagePct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-2.5">
                <div className="rounded-lg border border-border/60 bg-card/80 px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={cn("h-3.5 w-3.5", car.accidents === 0 ? "text-primary/70" : car.accidents >= 3 ? "text-red-500" : "text-amber-500")} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("mock_label_accidents")}
                    </span>
                  </div>
                  <p className={cn(
                    "mt-1 text-xs font-bold",
                    car.accidents === 0 ? "text-primary" : car.accidents >= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
                  )}>
                    {car.accidents === 0 ? t("demo_none_found") : `${car.accidents} ${t("demo_found")}`}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/80 px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <Users className={cn("h-3.5 w-3.5", car.owners <= 1 ? "text-primary/70" : car.owners >= 4 ? "text-red-500" : "text-amber-500")} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("mock_label_owners")}
                    </span>
                  </div>
                  <p className={cn(
                    "mt-1 text-xs font-bold",
                    car.owners <= 1 ? "text-primary" : car.owners >= 4 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
                  )}>
                    {car.owners === 1 ? t("owner_single") : `${car.owners} ${t("mock_label_owners")}`}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/80 px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={cn("h-3.5 w-3.5", car.salvage ? "text-red-500" : "text-primary/70")} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("mock_label_salvage")}
                    </span>
                  </div>
                  <p className={cn(
                    "mt-1 text-xs font-bold",
                    car.salvage ? "text-red-600 dark:text-red-400" : "text-primary",
                  )}>
                    {car.salvage ? t("demo_flagged") : t("report_clean")}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/80 px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className={cn("h-3.5 w-3.5", car.stolen ? "text-red-500" : "text-primary/70")} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("theft_records")}
                    </span>
                  </div>
                  <p className={cn(
                    "mt-1 text-xs font-bold",
                    car.stolen ? "text-red-600 dark:text-red-400" : "text-primary",
                  )}>
                    {car.stolen ? t("theft_flagged") : t("report_not_stolen")}
                  </p>
                </div>
              </div>
            </div>
          </AnimatePresence>
          </div>
        </div>
      </DemoCardShowcase>
    );
  }

  const card = (
    <div className={cn(
      "w-full min-w-0 rounded-2xl overflow-hidden select-none isolate [transform:translateZ(0)]",
      "border border-black/[0.08] dark:border-white/[0.08]",
      "bg-white dark:bg-[#0d1117]",
      !compact && c.lightGlow,
      !compact && c.darkGlow,
      heroSide && "shadow-xl shadow-black/10 dark:shadow-black/45",
    )}>
      {/* Accent stripe */}
      <div className={cn("h-[3px] bg-gradient-to-r", c.accentBar)} />

      {/* ── Car photo ── */}
      <div className={cn(
        "relative overflow-hidden bg-muted/40 dark:bg-white/[0.03] isolate [transform:translateZ(0)]",
        photoHeight,
      )}>
        {frozen ? (
          <div className="absolute inset-0 overflow-hidden [transform:translateZ(0)]">
            <DemoCarPhoto
              src={car.photo}
              alt={`${car.year} ${car.name}`}
              eager
            />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden [transform:translateZ(0)]">
            {cars.map((slideCar, slideIdx) => {
              const isActive = slideIdx === idx;
              const isNext = slideIdx === (idx + 1) % cars.length;
              return (
                <div
                  key={slideCar.vin}
                  className={cn(
                    "absolute inset-0 overflow-hidden transition-opacity duration-500 ease-out",
                    isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none",
                  )}
                  aria-hidden={!isActive}
                >
                  <div
                    className={cn(
                      "h-full w-full transition-transform duration-[5000ms] ease-linear",
                      isActive ? "scale-[1.06]" : "scale-100",
                    )}
                  >
                    <DemoCarPhoto
                      src={slideCar.photo}
                      alt={`${slideCar.year} ${slideCar.name}`}
                      eager={isActive || isNext}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtle scan shimmer */}
        {!compact && !frozen && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.08] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.35)_48%,transparent_100%)] bg-[length:100%_220%] animate-[demo-scan_4.5s_ease-in-out_infinite]"
        />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]"
        />

        {/* Bottom gradient fade into card */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-[#0d1117] to-transparent" />

        {/* Top overlay: VIN + badge */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent" />
        {frozen ? (
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlagImg code={displayFlag} size={20} className="rounded-sm shadow-sm" />
              <span className="font-mono text-[10px] text-white/80 tracking-widest drop-shadow">
                {truncVin(car.vin)}
              </span>
            </div>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm",
              c.badge,
            )}>
              {t(CONDITION_LABEL_KEYS[car.condition])}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={car.vin + "-overlay"}
              className="absolute top-3 left-4 right-4 flex items-center justify-between"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <FlagImg code={displayFlag} size={20} className="rounded-sm shadow-sm" />
                <span className="font-mono text-[10px] text-white/80 tracking-widest drop-shadow">
                  {truncVin(car.vin)}
                </span>
              </div>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm",
                c.badge,
              )}>
                {t(CONDITION_LABEL_KEYS[car.condition])}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Car info + score ── */}
      <div className={cn(compact ? "px-3 pt-1 pb-2" : "px-5 pt-1 pb-4")}>
        {frozen ? (
          <div>
            <p className={cn(
              "text-foreground dark:text-white font-bold leading-tight",
              compact ? "text-[15px]" : heroSide ? "text-lg" : "text-[17px]",
            )}>
              {car.year} {car.name}
            </p>
            <p className="text-muted-foreground/50 dark:text-white/25 text-[10px] font-mono tracking-wide mt-0.5">
              {subtitle}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={car.vin + "-info"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className={cn(
                "text-foreground dark:text-white font-bold leading-tight",
                compact ? "text-[15px]" : "text-[17px]",
              )}>
                {car.year} {car.name}
              </p>
              <p className="text-muted-foreground/50 dark:text-white/25 text-[10px] font-mono tracking-wide mt-0.5">
                {subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 dark:text-white/35">
              {t("demo_trust_score")}
            </span>
            {frozen ? (
              <span className={cn("font-black tabular-nums", heroSide ? "text-3xl" : compact ? "text-[1.35rem]" : "text-3xl", c.scoreColor)}>
                {car.score.toFixed(1)}
                <span className="text-sm font-semibold text-muted-foreground/40 dark:text-white/25"> /10</span>
              </span>
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={car.vin + "-score"}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn("font-black tabular-nums", compact ? "text-[1.35rem]" : "text-3xl", c.scoreColor)}
                >
                  {car.score.toFixed(1)}
                  <span className="text-sm font-semibold text-muted-foreground/40 dark:text-white/25"> /10</span>
                </motion.span>
              </AnimatePresence>
            )}
          </div>
          <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/8 overflow-hidden">
            {frozen ? (
              <div
                className={cn("h-2 rounded-full", c.barColor)}
                style={{ width: `${car.score * 10}%` }}
              />
            ) : (
              <motion.div
                key={car.vin + "-bar"}
                className={cn("h-2 rounded-full relative overflow-hidden", c.barColor)}
                initial={{ width: "0%" }}
                animate={{ width: `${car.score * 10}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ left: ["-20%", "120%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Data rows ── */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.025]">
        {frozen ? (
          <div>
            <div className={cn(rowClass, "flex-col items-stretch gap-2")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className={ICO} />
                  <span className={LBL}>{t("demo_odometer")}</span>
                </div>
                <span className={cn("text-[12px] font-semibold tabular-nums", milTextColor(mileagePct))}>
                  {car.mileage.toLocaleString()} {car.unit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/8 overflow-hidden">
                <div
                  className={cn("h-1.5 rounded-full", milColor(mileagePct))}
                  style={{ width: `${mileagePct}%` }}
                />
              </div>
            </div>

            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn(ICO, car.accidents > 0 && "text-amber-500 dark:text-amber-400/60")} />
                <span className={LBL}>{t("mock_label_accidents")}</span>
              </div>
              <span className={cn("text-[12px] font-semibold",
                car.accidents === 0 ? c.okColor : car.accidents >= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {car.accidents === 0 ? t("demo_none_found") : `${car.accidents} ${t("demo_found")}`}
              </span>
            </div>

            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <ShieldAlert className={cn(ICO, car.salvage && "text-red-500 dark:text-red-400/60")} />
                <span className={LBL}>{t("mock_label_salvage")}</span>
              </div>
              <span className={cn("text-[12px] font-semibold",
                car.salvage ? "text-red-600 dark:text-red-400" : c.okColor
              )}>
                {car.salvage ? t("demo_flagged") : t("report_clean")}
              </span>
            </div>

            {!compact && (
            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <Users className={cn(ICO, car.owners > 2 && "text-amber-500 dark:text-amber-400/60")} />
                <span className={LBL}>{t("mock_label_owners")}</span>
              </div>
              <span className={cn(
                "text-[12px] font-semibold",
                car.owners <= 1 ? c.okColor : car.owners >= 4 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
              )}>
                {car.owners === 1
                  ? t("owner_single")
                  : `${car.owners} ${t("mock_label_owners")}`}
              </span>
            </div>
            )}
          </div>
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={car.vin + "-rows"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className={cn(rowClass, "flex-col items-stretch gap-2")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className={ICO} />
                  <span className={LBL}>{t("demo_odometer")}</span>
                </div>
                <span className={cn("text-[12px] font-semibold tabular-nums", milTextColor(mileagePct))}>
                  {car.mileage.toLocaleString()} {car.unit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/8 overflow-hidden">
                <motion.div
                  key={car.vin + "-mil"}
                  className={cn("h-1.5 rounded-full", milColor(mileagePct))}
                  initial={{ width: "0%" }}
                  animate={{ width: `${mileagePct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn(ICO, car.accidents > 0 && "text-amber-500 dark:text-amber-400/60")} />
                <span className={LBL}>{t("mock_label_accidents")}</span>
              </div>
              <span className={cn("text-[12px] font-semibold",
                car.accidents === 0 ? c.okColor : car.accidents >= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {car.accidents === 0 ? t("demo_none_found") : `${car.accidents} ${t("demo_found")}`}
              </span>
            </div>

            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <ShieldAlert className={cn(ICO, car.salvage && "text-red-500 dark:text-red-400/60")} />
                <span className={LBL}>{t("mock_label_salvage")}</span>
              </div>
              <span className={cn("text-[12px] font-semibold",
                car.salvage ? "text-red-600 dark:text-red-400" : c.okColor
              )}>
                {car.salvage ? t("demo_flagged") : t("report_clean")}
              </span>
            </div>

            {!compact && (
            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <Users className={cn(ICO, car.owners > 2 && "text-amber-500 dark:text-amber-400/60")} />
                <span className={LBL}>{t("mock_label_owners")}</span>
              </div>
              <span className={cn(
                "text-[12px] font-semibold",
                car.owners <= 1 ? c.okColor : car.owners >= 4 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
              )}>
                {car.owners === 1
                  ? t("owner_single")
                  : `${car.owners} ${t("mock_label_owners")}`}
              </span>
            </div>
            )}

            {!compact && (
            <div className={rowClass}>
              <div className="flex items-center gap-2">
                <Fingerprint className={ICO} />
                <span className={LBL}>{t("theft_records")}</span>
              </div>
              <span className={cn("text-[12px] font-semibold",
                car.stolen ? "text-red-600 dark:text-red-400" : c.okColor
              )}>
                {car.stolen ? t("stolen") : t("not_stolen")}
              </span>
            </div>
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </div>

      {/* ── Dot nav ── */}
      {!frozen && (
      <div className={cn(
        "bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between gap-3",
        compact ? "px-3 py-1.5" : "px-5 py-3",
      )}>
        <span className="text-[10px] font-medium text-muted-foreground/70 dark:text-white/30 tabular-nums">
          {idx + 1}<span className="opacity-40 mx-0.5">/</span>{cars.length}
        </span>
        <div className="flex gap-1.5 items-center">
          {cars.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} / ${cars.length}`}
              aria-current={i === idx ? "true" : undefined}
              onClick={() => setIdx(i)}
              className={cn(
                "rounded-full transition-all duration-500",
                i === idx
                  ? "w-5 h-1.5 bg-primary shadow-[0_0_10px_rgba(34,197,94,0.45)]"
                  : "w-1.5 h-1.5 bg-black/15 dark:bg-white/15 hover:bg-black/30 dark:hover:bg-white/30",
              )}
            />
          ))}
        </div>
      </div>
      )}
    </div>
  );

  if (heroSide) {
    return (
      <div className="w-full max-w-[min(100%,360px)]" aria-hidden>
        {card}
      </div>
    );
  }

  return card;
}
