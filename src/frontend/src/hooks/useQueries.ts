import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// =====================
// Types (matching backend.d.ts)
// =====================

export type PaymentMethod =
  | { Easypaisa: null }
  | { JazzCash: null }
  | { BankTransfer: null };

export type DepositStatus =
  | { Pending: null }
  | { Approved: null }
  | { Rejected: null };

export type WithdrawalStatus =
  | { Pending: null }
  | { Approved: null }
  | { Rejected: null };

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface UserProfile {
  id: Principal;
  username: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy: [string] | [];
  coinBalance: number;
  planStartDay: bigint;
  planDay: bigint;
  adsWatchedToday: bigint;
  lastAdDate: string;
  lastClaimDate: string;
  teamRewardEligible: boolean;
  referralBonusPaid: boolean;
  createdAt: bigint;
}

export interface AdRecord {
  id: bigint;
  title: string;
  url: string;
  active: boolean;
}

export interface DepositRecord {
  id: bigint;
  userId: Principal;
  amount: number;
  method: PaymentMethod;
  screenshotHash: string;
  status: DepositStatus;
  createdAt: bigint;
  note: string;
}

export interface WithdrawalRecord {
  id: bigint;
  userId: Principal;
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
  netAmount: number;
  status: WithdrawalStatus;
  createdAt: bigint;
}

export interface AppStats {
  totalUsers: bigint;
  totalDeposits: bigint;
  totalWithdrawals: bigint;
  pendingDeposits: bigint;
  pendingWithdrawals: bigint;
}

// =====================
// Helper functions
// =====================

export function getPaymentMethodLabel(method: PaymentMethod): string {
  if ("Easypaisa" in method) return "Easypaisa";
  if ("JazzCash" in method) return "JazzCash";
  if ("BankTransfer" in method) return "Bank Transfer";
  return "Unknown";
}

export function getDepositStatusLabel(status: DepositStatus): string {
  if ("Pending" in status) return "Pending";
  if ("Approved" in status) return "Approved";
  if ("Rejected" in status) return "Rejected";
  return "Unknown";
}

export function getWithdrawalStatusLabel(status: WithdrawalStatus): string {
  if ("Pending" in status) return "Pending";
  if ("Approved" in status) return "Approved";
  if ("Rejected" in status) return "Rejected";
  return "Unknown";
}

export function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// =====================
// Auth / Role Queries
// =====================

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return { guest: null };
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// =====================
// User Profile Queries
// =====================

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<{ ok: UserProfile } | { err: string }>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return { err: "No actor" };
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useMyTeamSize() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["myTeamSize"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getMyTeamSize();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyDailyProfit() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["myDailyProfit"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getMyDailyProfit();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyReferrals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["myReferrals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyReferrals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      email,
      phone,
      referralCode,
    }: {
      username: string;
      email: string;
      phone: string;
      referralCode: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const referralOpt: [string] | [] = referralCode ? [referralCode] : [];
      return actor.registerUser(username, email, phone, referralOpt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}

// =====================
// Ads Queries
// =====================

export function useActiveAds() {
  const { actor, isFetching } = useActor();
  return useQuery<AdRecord[]>({
    queryKey: ["activeAds"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveAds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWatchAd() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.watchAd(adId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useClaimDailyProfit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.claimDailyProfit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myDailyProfit"] });
    },
  });
}

// =====================
// Deposit Queries
// =====================

export function useMyDeposits() {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRecord[]>({
    queryKey: ["myDeposits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDeposits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      method,
      screenshotHash,
    }: {
      amount: number;
      method: PaymentMethod;
      screenshotHash: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitDeposit(amount, method, screenshotHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// =====================
// Withdrawal Queries
// =====================

export function useMyWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRecord[]>({
    queryKey: ["myWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyWithdrawals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      method,
      accountNumber,
    }: {
      amount: number;
      method: PaymentMethod;
      accountNumber: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitWithdrawal(amount, method, accountNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// =====================
// Admin Queries
// =====================

export function useAdminStats() {
  const { actor, isFetching } = useActor();
  return useQuery<AppStats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalUsers: BigInt(0),
          totalDeposits: BigInt(0),
          totalWithdrawals: BigInt(0),
          pendingDeposits: BigInt(0),
          pendingWithdrawals: BigInt(0),
        };
      return actor.adminGetStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAdminAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["adminAllUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminAllDeposits() {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRecord[]>({
    queryKey: ["adminAllDeposits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllDeposits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminPendingDeposits() {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRecord[]>({
    queryKey: ["adminPendingDeposits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetPendingDeposits();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useAdminApproveDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      depositId,
      note,
    }: { depositId: bigint; note: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.adminApproveDeposit(depositId, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminRejectDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      depositId,
      note,
    }: { depositId: bigint; note: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.adminRejectDeposit(depositId, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminAdjustCoins() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      delta,
      reason,
    }: {
      userId: Principal;
      delta: number;
      reason: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.adminAdjustCoins(userId, delta, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
    },
  });
}

export function useAdminAllWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRecord[]>({
    queryKey: ["adminAllWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllWithdrawals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminPendingWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRecord[]>({
    queryKey: ["adminPendingWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetPendingWithdrawals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useAdminApproveWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (withdrawalId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.adminApproveWithdrawal(withdrawalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (withdrawalId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.adminRejectWithdrawal(withdrawalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminAllAds() {
  const { actor, isFetching } = useActor();
  return useQuery<AdRecord[]>({
    queryKey: ["adminAllAds"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllAds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminAddAd() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, url }: { title: string; url: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.adminAddAd(title, url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllAds"] });
      queryClient.invalidateQueries({ queryKey: ["activeAds"] });
    },
  });
}

export function useAdminToggleAd() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.adminToggleAd(adId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllAds"] });
      queryClient.invalidateQueries({ queryKey: ["activeAds"] });
    },
  });
}

export function useAdminRemoveAd() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.adminRemoveAd(adId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllAds"] });
      queryClient.invalidateQueries({ queryKey: ["activeAds"] });
    },
  });
}
