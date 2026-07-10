import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAYMENT_LOGOS = [
  {
    file: "paypal6.png",
    alt: "PayPal",
    boxClassName: "h-14 w-28 sm:h-16 sm:w-32",
  },
  {
    file: "mastercard666.png",
    alt: "Mastercard",
    boxClassName: "h-16 w-[7.75rem] sm:h-[4.5rem] sm:w-[9rem]",
  },
  {
    file: "visa6.png",
    alt: "Visa",
    boxClassName: "h-12 w-24 sm:h-14 sm:w-28",
  },
] as const;

export function CheckoutPaymentLogos({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {PAYMENT_LOGOS.map(({ file, alt, boxClassName }) => (
          <span
            key={file}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-3.5 py-2",
              boxClassName,
            )}
          >
            <img
              src={`${basePath}/payments/${file}`}
              alt={alt}
              className="checkout-payment-logo-img max-h-full max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
