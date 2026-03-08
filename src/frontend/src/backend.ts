import { IDL } from "@icp-sdk/core/candid";
import { Actor, type ActorConfig, type ActorMethod } from "@icp-sdk/core/agent";
import type { HttpAgentOptions } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

// ─── Types ────────────────────────────────────────────────────────────────

export type WithdrawalStatus =
  | { Approved: null }
  | { Pending: null }
  | { Rejected: null };

export interface WithdrawalRecord {
  accountNumber: string;
  amount: number;
  createdAt: bigint;
  id: bigint;
  method: PaymentMethod;
  netAmount: number;
  status: WithdrawalStatus;
  userId: Principal;
}

export type UserRole = { admin: null } | { guest: null } | { user: null };

export interface UserProfile {
  adsWatchedToday: bigint;
  coinBalance: number;
  createdAt: bigint;
  email: string;
  id: Principal;
  lastAdDate: string;
  lastClaimDate: string;
  phone: string;
  planDay: bigint;
  planStartDay: bigint;
  referralBonusPaid: boolean;
  referralCode: string;
  referredBy: [] | [string];
  teamRewardEligible: boolean;
  username: string;
}

export type PaymentMethod =
  | { BankTransfer: null }
  | { Easypaisa: null }
  | { JazzCash: null };

export type DepositStatus =
  | { Approved: null }
  | { Pending: null }
  | { Rejected: null };

export interface DepositRecord {
  amount: number;
  createdAt: bigint;
  id: bigint;
  method: PaymentMethod;
  note: string;
  screenshotHash: string;
  status: DepositStatus;
  userId: Principal;
}

export interface AppStats {
  pendingDeposits: bigint;
  pendingWithdrawals: bigint;
  totalDeposits: bigint;
  totalUsers: bigint;
  totalWithdrawals: bigint;
}

export interface AdRecord {
  active: boolean;
  id: bigint;
  title: string;
  url: string;
}

export interface backendInterface {
  _initializeAccessControlWithSecret: ActorMethod<[string], undefined>;
  adminAddAd: ActorMethod<[string, string], bigint>;
  adminAdjustCoins: ActorMethod<
    [Principal, number, string],
    { ok: null } | { err: string }
  >;
  adminApproveDeposit: ActorMethod<
    [bigint, string],
    { ok: null } | { err: string }
  >;
  adminApproveWithdrawal: ActorMethod<[bigint], { ok: null } | { err: string }>;
  adminGetAllAds: ActorMethod<[], AdRecord[]>;
  adminGetAllDeposits: ActorMethod<[], DepositRecord[]>;
  adminGetAllUsers: ActorMethod<[], UserProfile[]>;
  adminGetAllWithdrawals: ActorMethod<[], WithdrawalRecord[]>;
  adminGetPendingDeposits: ActorMethod<[], DepositRecord[]>;
  adminGetPendingWithdrawals: ActorMethod<[], WithdrawalRecord[]>;
  adminGetStats: ActorMethod<[], AppStats>;
  adminRejectDeposit: ActorMethod<
    [bigint, string],
    { ok: null } | { err: string }
  >;
  adminRejectWithdrawal: ActorMethod<[bigint], { ok: null } | { err: string }>;
  adminRemoveAd: ActorMethod<[bigint], { ok: null } | { err: string }>;
  adminToggleAd: ActorMethod<[bigint], { ok: null } | { err: string }>;
  assignCallerUserRole: ActorMethod<[Principal, UserRole], undefined>;
  claimDailyProfit: ActorMethod<[], { ok: number } | { err: string }>;
  getActiveAds: ActorMethod<[], AdRecord[]>;
  getCallerUserRole: ActorMethod<[], UserRole>;
  getMyDailyProfit: ActorMethod<[], number>;
  getMyDeposits: ActorMethod<[], DepositRecord[]>;
  getMyProfile: ActorMethod<[], { ok: UserProfile } | { err: string }>;
  getMyReferrals: ActorMethod<[], UserProfile[]>;
  getMyTeamSize: ActorMethod<[], bigint>;
  getMyWithdrawals: ActorMethod<[], WithdrawalRecord[]>;
  isCallerAdmin: ActorMethod<[], boolean>;
  lookupReferralCode: ActorMethod<[string], boolean>;
  registerUser: ActorMethod<
    [string, string, string, [] | [string]],
    { ok: UserProfile } | { err: string }
  >;
  submitDeposit: ActorMethod<
    [number, PaymentMethod, string],
    { ok: bigint } | { err: string }
  >;
  submitWithdrawal: ActorMethod<
    [number, PaymentMethod, string],
    { ok: bigint } | { err: string }
  >;
  watchAd: ActorMethod<[bigint], { ok: bigint } | { err: string }>;
}

// ─── CreateActorOptions ───────────────────────────────────────────────────

export interface CreateActorOptions {
  agentOptions?: HttpAgentOptions;
  actorOptions?: Partial<ActorConfig>;
  agent?: import("@icp-sdk/core/agent").HttpAgent;
  processError?: (e: unknown) => never;
}

// ─── ExternalBlob ─────────────────────────────────────────────────────────

export class ExternalBlob {
  private _bytes?: Uint8Array;
  private _url?: string;
  public onProgress?: (percentage: number) => void;

  private constructor() {}

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const blob = new ExternalBlob();
    blob._bytes = bytes;
    return blob;
  }

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    blob._url = url;
    return blob;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      const buf = await res.arrayBuffer();
      this._bytes = new Uint8Array(buf);
      return this._bytes;
    }
    return new Uint8Array();
  }

  getURL(): string | undefined {
    return this._url;
  }
}

// ─── IDL Factory ──────────────────────────────────────────────────────────

const WithdrawalStatusIDL = IDL.Variant({
  Approved: IDL.Null,
  Pending: IDL.Null,
  Rejected: IDL.Null,
});

const PaymentMethodIDL = IDL.Variant({
  BankTransfer: IDL.Null,
  Easypaisa: IDL.Null,
  JazzCash: IDL.Null,
});

const WithdrawalRecordIDL = IDL.Record({
  accountNumber: IDL.Text,
  amount: IDL.Float64,
  createdAt: IDL.Int,
  id: IDL.Nat,
  method: PaymentMethodIDL,
  netAmount: IDL.Float64,
  status: WithdrawalStatusIDL,
  userId: IDL.Principal,
});

const UserRoleIDL = IDL.Variant({
  admin: IDL.Null,
  guest: IDL.Null,
  user: IDL.Null,
});

const UserProfileIDL = IDL.Record({
  adsWatchedToday: IDL.Nat,
  coinBalance: IDL.Float64,
  createdAt: IDL.Int,
  email: IDL.Text,
  id: IDL.Principal,
  lastAdDate: IDL.Text,
  lastClaimDate: IDL.Text,
  phone: IDL.Text,
  planDay: IDL.Nat,
  planStartDay: IDL.Int,
  referralBonusPaid: IDL.Bool,
  referralCode: IDL.Text,
  referredBy: IDL.Opt(IDL.Text),
  teamRewardEligible: IDL.Bool,
  username: IDL.Text,
});

const DepositStatusIDL = IDL.Variant({
  Approved: IDL.Null,
  Pending: IDL.Null,
  Rejected: IDL.Null,
});

const DepositRecordIDL = IDL.Record({
  amount: IDL.Float64,
  createdAt: IDL.Int,
  id: IDL.Nat,
  method: PaymentMethodIDL,
  note: IDL.Text,
  screenshotHash: IDL.Text,
  status: DepositStatusIDL,
  userId: IDL.Principal,
});

const AppStatsIDL = IDL.Record({
  pendingDeposits: IDL.Nat,
  pendingWithdrawals: IDL.Nat,
  totalDeposits: IDL.Nat,
  totalUsers: IDL.Nat,
  totalWithdrawals: IDL.Nat,
});

const AdRecordIDL = IDL.Record({
  active: IDL.Bool,
  id: IDL.Nat,
  title: IDL.Text,
  url: IDL.Text,
});

const ResultOkNull = IDL.Variant({ ok: IDL.Record({}), err: IDL.Text });
const ResultOkNat = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
const ResultOkFloat = IDL.Variant({ ok: IDL.Float64, err: IDL.Text });
const ResultOkUserProfile = IDL.Variant({ ok: UserProfileIDL, err: IDL.Text });

export const idlFactory: IDL.InterfaceFactory = ({ IDL: _IDL }) => {
  return _IDL.Service({
    _initializeAccessControlWithSecret: _IDL.Func([_IDL.Text], [], []),
    adminAddAd: _IDL.Func([_IDL.Text, _IDL.Text], [_IDL.Nat], []),
    adminAdjustCoins: _IDL.Func(
      [_IDL.Principal, _IDL.Float64, _IDL.Text],
      [ResultOkNull],
      [],
    ),
    adminApproveDeposit: _IDL.Func([_IDL.Nat, _IDL.Text], [ResultOkNull], []),
    adminApproveWithdrawal: _IDL.Func([_IDL.Nat], [ResultOkNull], []),
    adminGetAllAds: _IDL.Func([], [_IDL.Vec(AdRecordIDL)], ["query"]),
    adminGetAllDeposits: _IDL.Func([], [_IDL.Vec(DepositRecordIDL)], ["query"]),
    adminGetAllUsers: _IDL.Func([], [_IDL.Vec(UserProfileIDL)], ["query"]),
    adminGetAllWithdrawals: _IDL.Func(
      [],
      [_IDL.Vec(WithdrawalRecordIDL)],
      ["query"],
    ),
    adminGetPendingDeposits: _IDL.Func(
      [],
      [_IDL.Vec(DepositRecordIDL)],
      ["query"],
    ),
    adminGetPendingWithdrawals: _IDL.Func(
      [],
      [_IDL.Vec(WithdrawalRecordIDL)],
      ["query"],
    ),
    adminGetStats: _IDL.Func([], [AppStatsIDL], ["query"]),
    adminRejectDeposit: _IDL.Func([_IDL.Nat, _IDL.Text], [ResultOkNull], []),
    adminRejectWithdrawal: _IDL.Func([_IDL.Nat], [ResultOkNull], []),
    adminRemoveAd: _IDL.Func([_IDL.Nat], [ResultOkNull], []),
    adminToggleAd: _IDL.Func([_IDL.Nat], [ResultOkNull], []),
    assignCallerUserRole: _IDL.Func([_IDL.Principal, UserRoleIDL], [], []),
    claimDailyProfit: _IDL.Func([], [ResultOkFloat], []),
    getActiveAds: _IDL.Func([], [_IDL.Vec(AdRecordIDL)], ["query"]),
    getCallerUserRole: _IDL.Func([], [UserRoleIDL], ["query"]),
    getMyDailyProfit: _IDL.Func([], [_IDL.Float64], ["query"]),
    getMyDeposits: _IDL.Func([], [_IDL.Vec(DepositRecordIDL)], ["query"]),
    getMyProfile: _IDL.Func([], [ResultOkUserProfile], ["query"]),
    getMyReferrals: _IDL.Func([], [_IDL.Vec(UserProfileIDL)], ["query"]),
    getMyTeamSize: _IDL.Func([], [_IDL.Nat], ["query"]),
    getMyWithdrawals: _IDL.Func([], [_IDL.Vec(WithdrawalRecordIDL)], ["query"]),
    isCallerAdmin: _IDL.Func([], [_IDL.Bool], ["query"]),
    lookupReferralCode: _IDL.Func([_IDL.Text], [_IDL.Bool], ["query"]),
    registerUser: _IDL.Func(
      [_IDL.Text, _IDL.Text, _IDL.Text, _IDL.Opt(_IDL.Text)],
      [ResultOkUserProfile],
      [],
    ),
    submitDeposit: _IDL.Func(
      [_IDL.Float64, PaymentMethodIDL, _IDL.Text],
      [ResultOkNat],
      [],
    ),
    submitWithdrawal: _IDL.Func(
      [_IDL.Float64, PaymentMethodIDL, _IDL.Text],
      [ResultOkNat],
      [],
    ),
    watchAd: _IDL.Func([_IDL.Nat], [ResultOkNat], []),
  });
};

export const init = (_args: { IDL: typeof IDL }) => [];

// ─── createActor ──────────────────────────────────────────────────────────

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): backendInterface {
  const agent = options?.agent;
  const config: ActorConfig = {
    canisterId,
    ...(agent ? { agent } : {}),
  };
  return Actor.createActor<backendInterface>(idlFactory, config);
}
