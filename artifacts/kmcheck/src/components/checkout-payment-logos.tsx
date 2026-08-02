import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAYMENT_LOGOS = [
  {
    file: "paypal6.png",
    alt: "PayPal",
    boxClassName: "h-12 w-24 sm:h-14 sm:w-28",
  },
  {
    file: "mastercard666.png",
    alt: "Mastercard",
    boxClassName: "h-14 w-[6.5rem] sm:h-16 sm:w-[7.5rem] dark:hidden",
  },
  {
    file: "visa6.png",
    alt: "Visa",
    boxClassName: "h-11 w-20 sm:h-12 sm:w-24",
  },
] as const;

export function CheckoutPaymentLogos({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2.5">
        {PAYMENT_LOGOS.map(({ file, alt, boxClassName }) => (
          <span
            key={file}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-1 py-1",
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
