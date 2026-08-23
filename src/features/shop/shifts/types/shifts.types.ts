// Employee shifts, clock-in and cash close.
//
// Two layers that are easy to conflate, so they are named apart here:
//
//   THE PLAN   opening hours (per weekday) → shift templates (max 4 a day)
//              → assignees. Owner config, changes rarely.
//   THE FACT   a shift session: one employee, opened with a cash float, closed
//              with a hand count. Receipts and debt payments point at it.
//
// Shop-scoped by design: WAREHOUSE_ADMIN gets 403 on every /shifts endpoint
// because the role has no shop, so this lives under features/shop and never
// appears in the admin portal — the same reasoning as Customers.
//
// One shop has at most ONE open session, enforced in the database. So "is the
// shop trading?" and "am I the one working?" are the same row: compare
// `user_id` with your own id.

/** 0 = Sunday, matching JavaScript `getDay()`. No conversion anywhere. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** The server refuses a 5th slot on one weekday with `shift.SLOT_LIMIT_REACHED`. */
export const MAX_SLOTS_PER_WEEKDAY = 4;

// ── The plan: opening hours ─────────────────────────────────────────────────

/**
 * One weekday's trading window.
 *
 * A closed day KEEPS its times — read `is_closed`, never infer closed from
 * `"00:00:00"`. Two time conventions ride on the same pair of fields:
 *
 *   close later than open    ordinary day
 *   close earlier than open  trades past midnight (18:00 → 02:00)
 *   close === "24:00"        end of day, and NOT the same as "00:00"
 *
 * Responses always use `HH:MM:SS`; requests accept `HH:MM` or `HH:MM:SS`.
 */
export interface OpeningHoursDay {
  shop_id: number;
  weekday: Weekday;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

/**
 * Always 7 days, ordered 0–6, saved or not — an untouched day comes back closed
 * rather than missing, so the grid renders one shape and never has holes.
 */
export interface OpeningHours {
  /** IANA zone, e.g. "Asia/Damascus". All times above are wall-clock in it. */
  timezone: string;
  days: OpeningHoursDay[];
}

export interface OpeningHourInput {
  weekday: Weekday;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

/** Partial saves are rejected — `days` must carry all 7 weekdays, exactly once each. */
export interface UpdateOpeningHoursInput {
  days: OpeningHourInput[];
  /** Omit to leave the shop's current zone alone. */
  timezone?: string;
}

// ── The plan: templates and rotas ───────────────────────────────────────────

/** An employee on a slot's rota. The owner can never be one. */
export interface ShiftAssignee {
  id: number;
  name: string;
}

export interface ShiftTemplate {
  id: number;
  shop_id: number;
  weekday: Weekday;
  /** Server-assigned 1–4. Never sent on create — see `CreateShiftTemplateInput`. */
  slot_index: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  /**
   * Computed server-side against that day's opening hours. Never derive this
   * client-side: a 22:00 → 02:00 slot is 240 minutes, and naive subtraction
   * gives −1200.
   */
  duration_minutes: number;
  /**
   * Several employees per slot is intended, not a mistake — a weekly template is
   * worked by whoever is on rota that week, and a colleague covering should not
   * be flagged as unscheduled. Who works *right now* is settled by the session.
   */
  assignees: ShiftAssignee[];
}

/**
 * `slot_index` is deliberately absent. The server assigns the lowest free
 * position 1–4; two owners editing at once would otherwise both claim the same.
 */
export interface CreateShiftTemplateInput {
  weekday: Weekday;
  name: string;
  startTime: string;
  endTime: string;
}

/**
 * All optional. `weekday` cannot be changed — to move a slot to another day,
 * delete it and create it there.
 */
export interface UpdateShiftTemplateInput {
  name?: string;
  startTime?: string;
  endTime?: string;
}

/** Full replace, not a merge. `[]` clears the rota. Duplicates are de-duplicated. */
export interface AssignEmployeesInput {
  userIds: number[];
}

// ── The fact: sessions ──────────────────────────────────────────────────────

export enum ShiftSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/**
 * One worked shift. The same shape whether open or closed — there is no separate
 * `breakdown` object, the cash figures sit at the top level and are simply null
 * until the close fills them in.
 *
 * Every money field is a string ("50.00"). Never parse for arithmetic; use the
 * helpers in `common/utils/money`.
 */
export interface ShiftSession {
  id: number;
  shop_id: number;
  /** Whose shift this is — the person who opened it. */
  user_id: number;
  user_name: string;
  /** Null when no slot was running at the moment it opened. */
  shift_template_id: number | null;
  shift_template_name: string | null;
  /**
   * The trading day this shift belongs to, `YYYY-MM-DD`. A shift opened 23:30
   * Friday and closed 02:00 Saturday carries FRIDAY. Group history by this,
   * never by `opened_at`.
   */
  business_date: string;
  opened_at: string;
  closed_at: string | null;
  /**
   * Who counted the drawer. Anyone in the shop may close any shift, so this can
   * differ from `user_id` — surface both when it does. There is no
   * "not your session" error; do not build handling for one.
   *
   * NOTE: the API returns the id only, with no accompanying name.
   */
  closed_by: number | null;
  opening_float: string;
  /** The five figures below are null until the close, then frozen forever. */
  cash_sales: string | null;
  cash_collections: string | null;
  cash_payouts: string | null;
  /**
   * What the drawer should hold. Deliberately not shown before the close —
   * revealing it invites typing it back in, which is not a count.
   */
  expected_cash: string | null;
  counted_cash: string | null;
  /** Negative = short, positive = over, "0.00" = balanced. */
  cash_difference: string | null;
  /**
   * True when no slot was running OR the person is not on that slot's rota.
   * Information, never a block — and an owner is ALWAYS off-schedule, since
   * owners are never on a rota. Suppress it for SHOP_OWNER rather than badging
   * every owner shift as an exception.
   */
  is_off_schedule: boolean;
  notes: string | null;
  status: ShiftSessionStatus;
  /** Present in responses but undocumented and unused by this client. */
  client_session_id: string | null;
}

/** Cash already in the drawer when the shift starts. */
export interface OpenShiftInput {
  openingFloat: string;
}

/** The hand count, and nothing else — the difference is revealed afterwards. */
export interface CloseShiftInput {
  countedCash: string;
  notes?: string;
}

/**
 * A history row: the session plus what was rung up during it.
 *
 * `sales_total` and the cash figures are DIFFERENT NUMBERS and a gap between
 * them is not a discrepancy. A credit sale of 100 with a 30 down payment on a
 * 20 float is `sales_total: "100.00"` and `expected_cash: "50.00"`, both
 * correct. Label them "Sold" and "In the drawer"; never one column.
 */
export interface ShiftSessionRow extends ShiftSession {
  receipt_count: number;
  sales_total: string;
}

/** A receipt rung up during a shift, as listed on the session detail. */
export interface ShiftSessionReceipt {
  id: number;
  created_at: string;
  created_by: number;
  created_by_name: string;
  customer_name: string | null;
  is_free: boolean;
  /**
   * A receipt cancelled AFTER the close still appears here, marked cancelled,
   * while the frozen cash figures show what was counted on the night. Both are
   * true; do not try to reconcile them.
   */
  is_cancelled: boolean;
  on_credit: boolean;
  total_price: string;
}

export interface ShiftSessionDetail extends ShiftSessionRow {
  receipts: ShiftSessionReceipt[];
}

export interface ShiftSessionListParams {
  page?: number;
  limit?: number;
  /** Business dates, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  userId?: number;
  status?: ShiftSessionStatus;
}

// ── Reports ─────────────────────────────────────────────────────────────────

/**
 * Sales are attributed by who rang them up; cash differences by whose shift it
 * was. An owner selling during Sara's shift is the owner's sale but lands in
 * Sara's drawer — the two columns legitimately disagree.
 */
export interface ShiftReportByEmployee {
  user_id: number;
  user_name: string;
  shifts: number;
  receipt_count: number;
  sales_total: string;
  cash_difference: string;
  short_shifts: number;
}

export interface ShiftReportByShift {
  shift_template_id: number | null;
  /** Null for sessions opened with no slot running — label that group. */
  shift_template_name: string | null;
  weekday: Weekday;
  shifts: number;
  receipt_count: number;
  sales_total: string;
  cash_difference: string;
}

export interface ShiftReport {
  from: string | null;
  to: string | null;
  by_employee: ShiftReportByEmployee[];
  by_shift: ShiftReportByShift[];
}

export interface ShiftReportParams {
  from?: string;
  to?: string;
}
