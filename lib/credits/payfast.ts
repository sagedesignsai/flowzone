/**
 * PayFast Integration (South Africa)
 *
 * PayFast is a South African payment gateway supporting EFT, credit/debit cards,
 * and mobile payments. Their flow uses a browser form POST + server-side ITN
 * (Instant Transaction Notification).
 *
 * Flow:
 *   1. Server prepares signed form data → client browser POSTs to PayFast
 *   2. PayFast processes payment and sends ITN POST to our webhook endpoint
 *   3. PayFast redirects user to return_url (client-side)
 *   4. Server verifies ITN:
 *      a. Check signature matches (MD5 of URL-encoded params in field order)
 *      b. Check request originates from a valid PayFast domain/IP
 *      c. Check payment_status is "COMPLETE"
 *      d. Check amount_gross matches expected amount
 *      e. Re-post data to PayFast's /eng/query/validate for server-side confirmation
 *
 * Environment:
 *   PAYFAST_MERCHANT_ID    — Your PayFast merchant ID
 *   PAYFAST_MERCHANT_KEY   — Your PayFast merchant key
 *   PAYFAST_PASSPHRASE     — Your PayFast passphrase (for signature generation)
 *   PAYFAST_SANDBOX        — "true" to use sandbox.payfast.co.za
 */

import { createHash } from "node:crypto"

// ── Config ────────────────────────────────────────────────────

function config() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ""
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? ""
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ""
  const isSandbox = process.env.PAYFAST_SANDBOX === "true"

  if (!merchantId || !merchantKey) {
    throw new Error(
      "PayFast not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.",
    )
  }

  return {
    merchantId,
    merchantKey,
    passphrase,
    baseUrl: isSandbox
      ? "https://sandbox.payfast.co.za"
      : "https://www.payfast.co.za",
  }
}

// ── URL Encoding ──────────────────────────────────────────────

/**
 * Encode a value like PHP's urlencode():
 * - Spaces → `+` (not `%20`)
 * - Uppercase hex digits (e.g. `%2F` not `%2f`)
 */
function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/%([a-f0-9]{2})/g, (_m, hex) => `%${hex.toUpperCase()}`)
}

// ── Valid PayFast Hosts (for IP validation) ───────────────────

const VALID_PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
]

/**
 * Resolve valid PayFast IP addresses from their known hostnames.
 * This is dynamic — IPs can change, so we resolve at runtime.
 */
async function resolveValidPayFastIps(): Promise<Set<string>> {
  const ips = new Set<string>()

  await Promise.all(
    VALID_PAYFAST_HOSTS.map(async (host) => {
      try {
        const dns = await import("node:dns/promises")
        const addresses = await dns.resolve4(host)
        for (const addr of addresses) ips.add(addr)
      } catch {
        // If DNS fails for one host, try the others
      }
    }),
  )

  return ips
}

// ── Signature (NOTICE: field order matters — NOT alphabetical!) ──

/**
 * Build the PayFast parameter string from data.
 *
 * PayFast requires fields in the order they appear in the data
 * (which must match their "attribute description order").
 * DO NOT sort alphabetically — that produces wrong signatures.
 *
 * Each value is URL-encoded like PHP's urlencode() (spaces → `+`,
 * uppercase hex digits). Empty values are excluded.
 */
function buildParamString(data: Record<string, unknown>): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (key === "signature") continue
    if (value === "" || value === null || value === undefined) continue
    parts.push(`${key}=${pfEncode(String(value))}`)
  }

  return parts.join("&")
}

/**
 * Generate a PayFast security signature.
 *
 * Uses the param string built from the data (field order preserved)
 * + optional passphrase, then MD5-hashed.
 *
 * This matches PayFast's PHP library signature generation:
 *   `md5( $pfParamString . '&passphrase=' . urlencode($passphrase) )`
 */
export function generateSignature(
  data: Record<string, string | number>,
  passphrase?: string,
): string {
  const paramString = buildParamString(data)

  const signString = passphrase
    ? `${paramString}&passphrase=${pfEncode(passphrase)}`
    : paramString

  return createHash("md5").update(signString).digest("hex")
}

// ── IP / Domain Validation ────────────────────────────────────

/**
 * Check if the given IP belongs to a valid PayFast domain.
 *
 * Resolves known PayFast hostnames at runtime and compares
 * against the request IP.
 */
export async function isValidPayFastIp(remoteIp: string): Promise<boolean> {
  const validIps = await resolveValidPayFastIps()
  return validIps.has(remoteIp)
}

// ── ITN Verification ──────────────────────────────────────────

export interface PayFastITNData {
  m_payment_id: string
  pf_payment_id: string
  payment_status: string
  item_name: string
  item_description: string
  amount_gross: string
  amount_fee: string
  amount_net: string
  custom_str1: string
  custom_str2: string
  custom_str3: string
  name_first: string
  name_last: string
  email_address: string
  merchant_id: string
  signature: string
  [key: string]: string | undefined
}

/**
 * Verify an ITN (Instant Transaction Notification) from PayFast.
 *
 * Performs all 4 recommended checks:
 *   1. pfValidSignature  — verify MD5 signature
 *   2. pfValidIP         — check request IP comes from a valid PayFast domain
 *   3. pfValidPaymentData — check payment_status + amount_gross
 *   4. pfValidServerConfirmation — POST data to PayFast for validation
 *
 * Returns `{ valid: true, data }` or `{ valid: false, reason }`.
 */
export async function verifyITN(
  rawData: Record<string, string>,
  options?: {
    expectedAmount?: number // in ZAR cents
    remoteIp?: string
  },
): Promise<
  | { valid: true; data: PayFastITNData }
  | { valid: false; reason: string }
> {
  const cfg = config()
  const { expectedAmount, remoteIp } = options ?? {}

  // ── 1. Check merchant_id ─────────────────────────────────
  if (rawData.merchant_id !== cfg.merchantId) {
    return { valid: false, reason: "Merchant ID mismatch" }
  }

  // ── 2. Verify signature ──────────────────────────────────
  const receivedSig = rawData.signature
  const expectedSig = generateSignature(rawData, cfg.passphrase || undefined)

  if (receivedSig !== expectedSig) {
    return { valid: false, reason: "Signature mismatch" }
  }

  // ── 3. IP validation ─────────────────────────────────────
  if (remoteIp) {
    const ipValid = await isValidPayFastIp(remoteIp)
    if (!ipValid) {
      return { valid: false, reason: `Invalid source IP: ${remoteIp}` }
    }
  }

  // ── 4. Check payment status ──────────────────────────────
  if (rawData.payment_status !== "COMPLETE") {
    return {
      valid: false,
      reason: `Payment not complete: ${rawData.payment_status}`,
    }
  }

  // ── 5. Validate amount ───────────────────────────────────
  if (expectedAmount !== undefined) {
    const grossZar = Number.parseFloat(rawData.amount_gross)
    const grossCents = Math.round(grossZar * 100)
    if (grossCents !== expectedAmount) {
      return {
        valid: false,
        reason: `Amount mismatch: expected ${expectedAmount} cents ZAR, got ${grossCents} cents ZAR`,
      }
    }
  }

  // ── 6. Server-side confirmation ──────────────────────────
  try {
    const validationResult = await serverConfirmation(rawData, cfg.baseUrl)

    if (validationResult !== "VALID") {
      return {
        valid: false,
        reason: `PayFast server confirmation returned: ${validationResult}`,
      }
    }
  } catch (error) {
    return { valid: false, reason: `PayFast server confirmation error: ${error}` }
  }

  return { valid: true, data: rawData as unknown as PayFastITNData }
}

/**
 * Server-side confirmation (pfValidServerConfirmation).
 *
 * Sends the raw param string to PayFast's /eng/query/validate endpoint.
 * PayFast returns "VALID" if the transaction details are authentic.
 *
 * This is the CORRECT endpoint for server-to-server validation —
 * NOT /eng/process which is for browser redirects.
 */
async function serverConfirmation(
  data: Record<string, string>,
  baseUrl: string,
): Promise<string> {
  const url = `${baseUrl}/eng/query/validate`
  const paramString = buildParamString(data)

  const response = await fetch(url, {
    method: "POST",
    body: paramString,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  return (await response.text()).trim()
}

// ── Checkout Form Data ────────────────────────────────────────

export interface PayFastCheckoutData {
  /** URL to POST the form to */
  formAction: string
  /** Hidden form fields */
  formFields: Record<string, string>
}

/**
 * Prepare signed PayFast checkout data.
 *
 * IMPORTANT: The field order in the data object determines the
 * signature. It MUST match PayFast's "attribute description order":
 *
 *   merchant_id, merchant_key, return_url, cancel_url, notify_url,
 *   m_payment_id, amount, item_name, item_description,
 *   name_first, name_last, email_address, cell_number
 *
 * Do NOT reorder these fields alphabetically.
 */
export function preparePayFastCheckout({
  amount,
  itemName,
  itemDescription,
  mPaymentId,
  returnUrl,
  cancelUrl,
  notifyUrl,
  email,
  nameFirst,
  nameLast,
}: {
  /** Amount in ZAR (not cents) */
  amount: number
  itemName: string
  itemDescription?: string
  /** Your internal payment reference (used to map ITN to user + plan) */
  mPaymentId: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
  email?: string
  nameFirst?: string
  nameLast?: string
}): PayFastCheckoutData {
  const cfg = config()

  // FIELD ORDER MATTERS — must match PayFast's attribute description order:
  // merchant_id, merchant_key, return_url, cancel_url, notify_url,
  // m_payment_id, amount, item_name, item_description, name_first, name_last, email_address
  const data: Record<string, string | number> = {
    merchant_id: cfg.merchantId,
    merchant_key: cfg.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: mPaymentId,
    amount: amount.toFixed(2),
    item_name: itemName,
  }

  if (itemDescription) data.item_description = itemDescription
  if (nameFirst) data.name_first = nameFirst
  if (nameLast) data.name_last = nameLast
  if (email) data.email_address = email

  // Generate signature from the ordered data
  const signature = generateSignature(data, cfg.passphrase || undefined)
  data.signature = signature

  return {
    formAction: `${cfg.baseUrl}/eng/process`,
    formFields: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ),
  }
}

/**
 * Check if PayFast is configured (has merchant ID + key).
 */
export function isPayFastConfigured(): boolean {
  return Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY)
}
