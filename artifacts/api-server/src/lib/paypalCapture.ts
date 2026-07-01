export const PAYPAL_ORDER_ID_RE = /^[A-Z0-9]{8,20}$/;

export function isPaypalOrderAlreadyCaptured(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if (record.name === "RESOURCE_ALREADY_EXISTS") return true;
  if (record.name === "UNPROCESSABLE_ENTITY" && Array.isArray(record.details)) {
    return (record.details as Array<{ issue?: string }>).some(
      (d) => d.issue === "ORDER_ALREADY_CAPTURED",
    );
  }
  return false;
}

export function readPaypalOrderStatus(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const status = (body as { status?: unknown }).status;
  return typeof status === "string" ? status : null;
}

export async function fetchPaypalOrderStatus(
  base: string,
  accessToken: string,
  orderId: string,
): Promise<string | null> {
  const resp = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await resp.json().catch(() => null);
  return readPaypalOrderStatus(body);
}

export type PaypalCaptureAttempt = {
  httpOk: boolean;
  body: unknown;
  orderStatus: string | null;
  treatedAsCompleted: boolean;
};

/** Normalize PayPal capture response — handles already-captured orders. */
export async function interpretPaypalCaptureResponse(
  captureResp: Response,
  fetchOrderStatus: () => Promise<string | null>,
): Promise<PaypalCaptureAttempt> {
  const body = await captureResp.json().catch(() => ({}));
  let orderStatus = readPaypalOrderStatus(body);

  if (captureResp.ok && orderStatus === "COMPLETED") {
    return { httpOk: true, body, orderStatus, treatedAsCompleted: true };
  }

  if (!captureResp.ok && isPaypalOrderAlreadyCaptured(body)) {
    orderStatus = await fetchOrderStatus();
    if (orderStatus === "COMPLETED") {
      return { httpOk: true, body, orderStatus, treatedAsCompleted: true };
    }
  }

  if (!orderStatus) {
    orderStatus = await fetchOrderStatus();
    if (orderStatus === "COMPLETED") {
      return { httpOk: true, body, orderStatus, treatedAsCompleted: true };
    }
  }

  return {
    httpOk: captureResp.ok,
    body,
    orderStatus,
    treatedAsCompleted: orderStatus === "COMPLETED",
  };
}
