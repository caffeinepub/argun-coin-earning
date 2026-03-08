# ARGUN Coin Earning

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User registration and login (email or phone number, username)
- Wallet system: every user has a coin balance (1 PKR = 1 Coin)
- Deposit system: manual deposit with screenshot upload, payment methods (Easypaisa, JazzCash, Bank Transfer), minimum 100 PKR
- Profit Plan: 50-day earning plan — first 17 days earn 4.25 coins/day, then decreases by 0.025/day until 3 coins, then fixed 3 coins/day
- Ads Task System: 5 ads daily required to unlock "Claim Profit" button; track daily ad views
- Referral System: unique referral code per user; referrer earns 10 coins when referred user deposits 100+; referred user earns 5 bonus coins
- Withdrawal System: withdraw coins as PKR via Easypaisa or JazzCash; 10% fee auto-applied
- Team Reward System: mark users as "Team Reward Eligible" when referral team reaches 100 members
- Admin Panel: manage users, approve deposits, add/remove coins, view withdrawals, manage ads and profit plans

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

### Backend (Motoko)
1. User model: id, username, email, phone, passwordHash, referralCode, referredBy, coinBalance, planStartDate, planDay, adsWatchedToday, lastAdDate, lastClaimDate, isAdmin, teamRewardEligible
2. Deposit model: id, userId, amount, method, screenshotUrl, status (pending/approved/rejected), createdAt
3. Withdrawal model: id, userId, amount, method, accountNumber, netAmount (after 10% fee), status (pending/approved/rejected), createdAt
4. Profit tracking: calculate daily profit based on plan day; claim only if 5 ads watched
5. Referral tracking: on first deposit >= 100, reward referrer 10 coins and track that bonus was paid
6. Admin functions: listUsers, approveDeposit, rejectDeposit, adjustCoins, listWithdrawals, approveWithdrawal
7. Ads management: admin can set ad list; users mark each ad as watched

### Frontend
1. Landing / Auth screen: login and register forms (email or phone + password + optional referral code)
2. User Dashboard:
   - Wallet balance card
   - Daily profit display and countdown
   - Ads progress bar (X/5 watched) with "Watch Ad" buttons
   - "Claim Profit" button (active only after 5 ads)
   - Referral section with unique referral link/code and team size
   - Quick actions: Deposit, Withdraw
3. Deposit page: choose method, enter amount, upload screenshot
4. Withdrawal page: enter amount, choose method, enter account number; show net amount after fee
5. Referral page: referral code/link, team list, reward status
6. Admin Panel (admin-only route):
   - Users list with coin balances
   - Pending deposits with screenshot viewer and approve/reject
   - Manual coin adjustment
   - Withdrawal requests with approve/reject
   - Ads management (add/remove ads)
   - Profit plan settings view
