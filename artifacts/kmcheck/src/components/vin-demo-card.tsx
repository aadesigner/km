import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Gauge, Fingerprint, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { DemoCarPhoto, preloadDemoCarPhotos } from "@/components/demo-car-photo";
import { demoCarPhotoUrl } from "@/lib/demo-car-photos";

export interface DemoCar {
  vin: string;
  name: string;
  year: number;
  origin: "USA" | "Korea" | "Germany";
  flagImg: string;
  marketplace: string;
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
  /* Korea — encar.com */
  {
    vin: "KM8R3DGE3PU812456",
    name: "Hyundai Tucson",
    year: 2023,
    origin: "Korea",
    flagImg: "kr",
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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

  /* USA — CarGurus / Copart */
  {
    vin: "2T3P1RFV8NW214892",
    name: "Toyota RAV4",
    year: 2022,
    origin: "USA",
    flagImg: "us",
    marketplace: "CarGurus",
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
    marketplace: "CarGurus",
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
    marketplace: "CarGurus",
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
    marketplace: "CarGurus",
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
    marketplace: "Copart",
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

  /* Germany — popular imports (Korea encar · Canada AutoTrader) */
  {
    vin: "WBA8E9G50MNU51284",
    name: "BMW 320i",
    year: 2021,
    origin: "Germany",
    flagImg: "de",
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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
    marketplace: "encar.com",
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

function carsForCountry(country?: "usa" | "korea" | "canada"): DemoCar[] {
  if (!country) return ALL_CARS;
  if (country === "korea") {
    return ALL_CARS.filter((c) => c.origin === "Korea" || c.origin === "Germany");
  }
  if (country === "canada") {
    return ALL_CARS.filter((c) => c.origin === "USA" || c.origin === "Germany");
  }
  return ALL_CARS.filter((c) => c.origin === "USA");
}

function displayMarketplace(
  car: DemoCar,
  country?: "usa" | "korea" | "canada",
): string {
  if (country === "korea" && car.origin === "Germany") return "encar.com";
  if (country === "canada") {
    if (car.origin === "Germany") return "AutoTrader.ca";
    return car.marketplace === "Copart" ? "Copart CA" : "AutoTrader.ca";
  }
  return car.marketplace;
}

function registryLabel(
  car: DemoCar,
  country: "usa" | "korea" | "canada" | undefined,
  t: (key: string) => string,
): string {
  if (car.origin === "Germany") return t("demo_registry_germany");
  if (country === "korea" || car.origin === "Korea") return t("demo_registry_korea");
  if (country === "canada") return t("demo_registry_canada");
  return t("demo_registry_usa");
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
  /** Country pages — no right-edge shadow / heavy 3D on desktop */
  flat?: boolean;
}) {
  const { dir } = useTranslation();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const isRtl = dir === "rtl";
  /** Pivot from inner edge; card faces the hero column. */
  const transformOrigin = isRtl ? "100% 50%" : "0% 50%";
  const baseRotateY = isRtl ? 14 : -14;
  const baseRotateX = 4;
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
      x: baseRotateX - py * 2.2,
      y: baseRotateY + px * 3.2,
    });
  };

  const cardTransform = isDesktop && !flat
    ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(18px)`
    : isDesktop && flat
      ? "rotateY(-4deg) rotateX(1deg)"
      : "rotateY(-6deg) rotateX(2deg)";

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative w-full min-w-0 mx-auto lg:mx-0 lg:ms-auto",
        flat ? "py-0 max-w-[min(100%,340px)]" : "py-1 md:py-2 lg:py-3",
        wide && !flat ? "max-w-[min(100%,420px)]" : !flat ? "max-w-[min(100%,320px)]" : "",
      )}
      style={
        flat
          ? undefined
          : {
              perspective: "1600px",
              perspectiveOrigin: isRtl ? "65% 42%" : "35% 42%",
            }
      }
      onPointerMove={flat ? undefined : onPointerMove}
      onPointerLeave={flat ? undefined : resetTilt}
    >
      {!flat && (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-8 -z-20 rounded-[2rem] opacity-50 blur-3xl",
          "bg-gradient-to-br to-transparent",
          conditionGlow,
        )}
      />
      )}

      {/* Floor reflection */}
      {!flat && (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-3 h-14 w-[76%] rounded-[100%] blur-2xl opacity-60 -z-10",
          isRtl ? "right-[8%] bg-primary/15" : "left-[8%] bg-primary/15",
        )}
        style={{ transform: "rotateX(78deg) scaleY(0.45)" }}
      />
      )}

      <motion.div
        className="relative w-full [transform-style:preserve-3d]"
        animate={reduceMotion || !isDesktop || flat ? undefined : { y: [0, -5, 0] }}
        transition={
          reduceMotion || !isDesktop || flat
            ? undefined
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div
          className={cn(
            "relative w-full [transform-style:preserve-3d]",
            isDesktop && !flat && "transition-transform duration-300 ease-out",
          )}
          style={{
            transformOrigin,
            transform: cardTransform,
          }}
        >
          {/* Card thickness — outer edge depth */}
          {isDesktop && !flat && (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-4 bottom-4 w-2.5 rounded-sm hidden md:block",
                isRtl
                  ? "-left-2 bg-gradient-to-l from-black/30 to-black/12 dark:from-black/55 dark:to-black/20"
                  : "-right-2 bg-gradient-to-r from-black/30 to-black/12 dark:from-black/55 dark:to-black/20",
              )}
              style={{ transform: "translateZ(-14px)" }}
            />
          )}

          {!flat && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-5 h-8 w-[90%] hidden md:block -z-20 rounded-[100%] blur-xl",
              isRtl ? "right-[5%] bg-black/25 dark:bg-black/45" : "left-[5%] bg-black/25 dark:bg-black/45",
            )}
            style={{ transform: "rotateX(82deg) scaleY(0.5)" }}
          />
          )}

          <div
            className={cn(
              "relative rounded-2xl overflow-hidden [transform-style:preserve-3d]",
              "border border-white/30 dark:border-white/12",
              "bg-white dark:bg-[#0d1117]",
              flat
                ? "shadow-md shadow-black/8 dark:shadow-black/30"
                : cn(
                  isDesktop && !isRtl
                    && "shadow-[18px_24px_44px_-18px_rgba(0,0,0,0.32)] dark:shadow-[20px_28px_50px_-16px_rgba(0,0,0,0.6)]",
                  isDesktop && isRtl
                    && "shadow-[-18px_24px_44px_-18px_rgba(0,0,0,0.32)] dark:shadow-[-20px_28px_50px_-16px_rgba(0,0,0,0.6)]",
                  !isDesktop && "shadow-2xl shadow-black/15 dark:shadow-black/40",
                  accentClass,
                ),
            )}
          >
            {isDesktop && !flat && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 w-[3px] hidden md:block z-20",
                  isRtl
                    ? "right-0 bg-gradient-to-l from-white/30 to-transparent"
                    : "left-0 bg-gradient-to-r from-white/35 to-transparent",
                )}
              />
            )}
            {isDesktop && !flat && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden md:block z-10 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.04) 100%)",
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
  country?: "usa" | "korea" | "canada";
  showcase?: boolean;
  /** Single static preview — no carousel, transitions, or dot nav. */
  frozen?: boolean;
  /** Homepage hero flanks — larger layout beside the VIN form. */
  heroSide?: boolean;
}) {
  const { t } = useTranslation();
  const pool = carsForCountry(country);
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
    preloadDemoCarPhotos(cars.map(c => c.photo));
  }, [cars]);

  const car = cars[idx] ?? cars[0];
  if (!car) return null;
  const displayFlag = country === "canada" && car.origin === "USA" ? "ca" : car.flagImg;
  const displayMarketplaceLabel = displayMarketplace(car, country);
  const c = COND[car.condition];
  const compact = showcase && !heroSide;
  const rowClass = cn(
    compact ? "px-3 py-1.5" : "px-5 py-3",
    "flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] last:border-0",
  );
  const photoHeight = compact
    ? "h-28 sm:h-32 lg:h-36"
    : heroSide
      ? "h-48 lg:h-52"
      : "h-44";

  // US max = 200k mi → red above 140k mi (70%)
  // Korean max = 320k km → red above 224k km (70%)
  const maxMileage = car.unit === "mi" ? 200_000 : 320_000;
  const mileagePct = Math.min(100, Math.round((car.mileage / maxMileage) * 100));

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
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={car.vin + "-photo"}
              className="absolute inset-0 overflow-hidden [transform:translateZ(0)]"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1.06 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{
                opacity: { duration: 0.45, ease: "easeOut" },
                scale: { duration: 5, ease: "linear" },
              }}
            >
              <DemoCarPhoto
                src={car.photo}
                alt={`${car.year} ${car.name}`}
                eager
              />
            </motion.div>
          </AnimatePresence>
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
              <img
                src={`https://flagcdn.com/20x15/${displayFlag}.png`}
                width={20} height={15} alt=""
                className="rounded-sm shadow-sm"
              />
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
                <img
                  src={`https://flagcdn.com/20x15/${displayFlag}.png`}
                  width={20} height={15} alt=""
                  className="rounded-sm shadow-sm"
                />
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
              {displayMarketplaceLabel}
              <span className="mx-1.5 opacity-40">·</span>
              {registryLabel(car, country, t)}
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
                {displayMarketplaceLabel}
                <span className="mx-1.5 opacity-40">·</span>
                {registryLabel(car, country, t)}
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

  if (showcase && !heroSide) {
    return (
      <DemoCardShowcase wide flat accentClass="" condition={car.condition}>
        {card}
      </DemoCardShowcase>
    );
  }

  if (heroSide) {
    return (
      <div className="w-full max-w-[min(100%,360px)]" aria-hidden>
        {card}
      </div>
    );
  }

  return card;
}
