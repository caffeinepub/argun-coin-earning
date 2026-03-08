import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "./authorization/access-control";
import Prim "mo:prim";

actor {

  // ─── ACCESS CONTROL ───────────────────────────────────────────────────────
  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();

  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
      case (null) { Runtime.trap("CAFFEINE_ADMIN_TOKEN not set") };
      case (?tok) { AccessControl.initialize(accessControlState, caller, tok, userSecret) };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller)
  };
  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller)
  };
  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role)
  };

  // ─── TYPES ────────────────────────────────────────────────────────────────

  public type DepositStatus = { #Pending; #Approved; #Rejected };
  public type WithdrawalStatus = { #Pending; #Approved; #Rejected };
  public type PaymentMethod = { #Easypaisa; #JazzCash; #BankTransfer };

  public type UserProfile = {
    id : Principal;
    username : Text;
    email : Text;
    phone : Text;
    referralCode : Text;
    referredBy : ?Text;
    coinBalance : Float;
    planStartDay : Int;
    planDay : Nat;
    adsWatchedToday : Nat;
    lastAdDate : Text;
    lastClaimDate : Text;
    teamRewardEligible : Bool;
    referralBonusPaid : Bool;
    createdAt : Int;
  };

  public type DepositRecord = {
    id : Nat;
    userId : Principal;
    amount : Float;
    method : PaymentMethod;
    screenshotHash : Text;
    status : DepositStatus;
    createdAt : Int;
    note : Text;
  };

  public type WithdrawalRecord = {
    id : Nat;
    userId : Principal;
    amount : Float;
    method : PaymentMethod;
    accountNumber : Text;
    netAmount : Float;
    status : WithdrawalStatus;
    createdAt : Int;
  };

  public type AdRecord = {
    id : Nat;
    title : Text;
    url : Text;
    active : Bool;
  };

  public type AppStats = {
    totalUsers : Nat;
    totalDeposits : Nat;
    totalWithdrawals : Nat;
    pendingDeposits : Nat;
    pendingWithdrawals : Nat;
  };

  // ─── STATE ────────────────────────────────────────────────────────────────

  var users : Map.Map<Principal, UserProfile> = Map.empty();
  var referralIndex : Map.Map<Text, Principal> = Map.empty();
  var deposits : Map.Map<Nat, DepositRecord> = Map.empty();
  var withdrawals : Map.Map<Nat, WithdrawalRecord> = Map.empty();
  var ads : Map.Map<Nat, AdRecord> = Map.empty();

  var nextDepositId : Nat = 1;
  var nextWithdrawalId : Nat = 1;
  var nextAdId : Nat = 1;

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  func nowSec() : Int { Time.now() / 1_000_000_000 };

  func pad2(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() }
  };

  func unixDayText(sec : Int) : Text {
    let days : Nat = Int.abs(sec / 86400) + 719468;
    let era : Nat = days / 146097;
    let doe : Nat = days - era * 146097;
    let yoe : Nat = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Nat = yoe + era * 400;
    let doy : Nat = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Nat = (5 * doy + 2) / 153;
    let day : Nat = doy - (153 * mp + 2) / 5 + 1;
    let month : Nat = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year : Nat = if (month <= 2) { y + 1 } else { y };
    year.toText() # "-" # pad2(month) # "-" # pad2(day)
  };

  func todayText() : Text { unixDayText(nowSec()) };

  func genReferralCode(p : Principal) : Text {
    let s = p.toText();
    var code = "";
    for (ch in s.chars()) {
      if (code.size() >= 8) { };
      if ((ch >= 'a' and ch <= 'z') or (ch >= '0' and ch <= '9')) {
        if (code.size() < 8) {
          code := code # Text.fromChar(ch);
        };
      };
    };
    while (code.size() < 8) { code := code # "x" };
    var upper = "";
    for (ch in code.chars()) {
      if (ch >= 'a' and ch <= 'z') {
        let n = Prim.charToNat32(ch);
        upper := upper # Text.fromChar(Prim.nat32ToChar(n -% 32));
      } else {
        upper := upper # Text.fromChar(ch);
      };
    };
    upper
  };

  func calcDailyProfit(planDay : Nat) : Float {
    if (planDay == 0) { return 0.0 };
    if (planDay <= 17) { return 4.25 };
    let excess : Float = (planDay - 17).toFloat();
    let profit = 4.25 - excess * 0.025;
    if (profit < 3.0) { 3.0 } else { profit }
  };

  func teamSizeOf(myCode : Text) : Nat {
    var count = 0;
    for ((_, u) in users.entries()) {
      switch (u.referredBy) {
        case (?code) { if (code == myCode) { count += 1 } };
        case (null) {};
      };
    };
    count
  };

  // ─── REGISTRATION & PROFILE ───────────────────────────────────────────────

  public shared ({ caller }) func registerUser(username : Text, email : Text, phone : Text, referralCodeOpt : ?Text) : async { #ok : UserProfile; #err : Text } {
    if (caller.isAnonymous()) { return #err("Anonymous users cannot register") };
    switch (users.get(caller)) {
      case (?_) { return #err("User already registered") };
      case (null) {};
    };
    let refBy : ?Text = switch (referralCodeOpt) {
      case (null) { null };
      case (?code) {
        let trimmed = code.trim(#char ' ');
        if (trimmed == "") { null } else {
          switch (referralIndex.get(trimmed)) {
            case (?_) { ?trimmed };
            case (null) { return #err("Invalid referral code") };
          }
        }
      };
    };

    let baseCode = genReferralCode(caller);
    let finalCode = switch (referralIndex.get(baseCode)) {
      case (?_) { baseCode # "1" };
      case (null) { baseCode };
    };

    let profile : UserProfile = {
      id = caller;
      username;
      email;
      phone;
      referralCode = finalCode;
      referredBy = refBy;
      coinBalance = 0.0;
      planStartDay = -1;
      planDay = 0;
      adsWatchedToday = 0;
      lastAdDate = "";
      lastClaimDate = "";
      teamRewardEligible = false;
      referralBonusPaid = false;
      createdAt = nowSec();
    };

    users.add(caller, profile);
    referralIndex.add(finalCode, caller);
    #ok(profile)
  };

  public query ({ caller }) func getMyProfile() : async { #ok : UserProfile; #err : Text } {
    switch (users.get(caller)) {
      case (?p) { #ok(p) };
      case (null) { #err("User not found") };
    }
  };

  public query ({ caller }) func getMyTeamSize() : async Nat {
    switch (users.get(caller)) {
      case (?p) { teamSizeOf(p.referralCode) };
      case (null) { 0 };
    }
  };

  public query ({ caller }) func getMyDailyProfit() : async Float {
    switch (users.get(caller)) {
      case (?p) { calcDailyProfit(p.planDay) };
      case (null) { 0.0 };
    }
  };

  // ─── ADS TASK SYSTEM ──────────────────────────────────────────────────────

  public shared ({ caller }) func watchAd(_adId : Nat) : async { #ok : Nat; #err : Text } {
    switch (users.get(caller)) {
      case (null) { return #err("User not found") };
      case (?p) {
        let today = todayText();
        let watched = if (p.lastAdDate == today) { p.adsWatchedToday } else { 0 };
        if (watched >= 5) { return #err("Already watched 5 ads today") };
        users.add(caller, { p with adsWatchedToday = watched + 1; lastAdDate = today });
        #ok(watched + 1)
      };
    }
  };

  public shared ({ caller }) func claimDailyProfit() : async { #ok : Float; #err : Text } {
    switch (users.get(caller)) {
      case (null) { return #err("User not found") };
      case (?p) {
        let today = todayText();
        let watched = if (p.lastAdDate == today) { p.adsWatchedToday } else { 0 };
        if (watched < 5) { return #err("Watch 5 ads first") };
        if (p.lastClaimDate == today) { return #err("Already claimed today") };
        if (p.planDay == 0) { return #err("No active profit plan. Please deposit first.") };
        if (p.planDay > 50) { return #err("Profit plan has ended") };
        let profit = calcDailyProfit(p.planDay);
        users.add(caller, { p with coinBalance = p.coinBalance + profit; planDay = p.planDay + 1; lastClaimDate = today });
        #ok(profit)
      };
    }
  };

  // ─── DEPOSIT SYSTEM ───────────────────────────────────────────────────────

  public shared ({ caller }) func submitDeposit(amount : Float, method : PaymentMethod, screenshotHash : Text) : async { #ok : Nat; #err : Text } {
    if (amount < 100.0) { return #err("Minimum deposit is 100 PKR") };
    switch (users.get(caller)) {
      case (null) { return #err("User not found") };
      case (?_) {};
    };
    let id = nextDepositId;
    nextDepositId += 1;
    deposits.add(id, { id; userId = caller; amount; method; screenshotHash; status = #Pending; createdAt = nowSec(); note = "" });
    #ok(id)
  };

  public query ({ caller }) func getMyDeposits() : async [DepositRecord] {
    deposits.values().toArray().filter(func(d : DepositRecord) : Bool { d.userId == caller })
  };

  // ─── WITHDRAWAL SYSTEM ────────────────────────────────────────────────────

  public shared ({ caller }) func submitWithdrawal(amount : Float, method : PaymentMethod, accountNumber : Text) : async { #ok : Nat; #err : Text } {
    if (amount < 100.0) { return #err("Minimum withdrawal is 100 coins") };
    switch (users.get(caller)) {
      case (null) { return #err("User not found") };
      case (?p) {
        if (p.coinBalance < amount) { return #err("Insufficient balance") };
        users.add(caller, { p with coinBalance = p.coinBalance - amount });
        let id = nextWithdrawalId;
        nextWithdrawalId += 1;
        withdrawals.add(id, { id; userId = caller; amount; method; accountNumber; netAmount = amount * 0.9; status = #Pending; createdAt = nowSec() });
        #ok(id)
      };
    }
  };

  public query ({ caller }) func getMyWithdrawals() : async [WithdrawalRecord] {
    withdrawals.values().toArray().filter(func(w : WithdrawalRecord) : Bool { w.userId == caller })
  };

  // ─── REFERRAL ─────────────────────────────────────────────────────────────

  public query func lookupReferralCode(code : Text) : async Bool {
    switch (referralIndex.get(code)) {
      case (?_) { true };
      case (null) { false };
    }
  };

  public query ({ caller }) func getMyReferrals() : async [UserProfile] {
    switch (users.get(caller)) {
      case (null) { return [] };
      case (?me) {
        users.values().toArray().filter(func(u : UserProfile) : Bool {
          switch (u.referredBy) {
            case (?code) { code == me.referralCode };
            case (null) { false };
          }
        })
      };
    }
  };

  // ─── ADMIN PANEL ──────────────────────────────────────────────────────────

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Admin access required")
    }
  };

  public query ({ caller }) func adminGetAllUsers() : async [UserProfile] {
    requireAdmin(caller);
    users.values().toArray()
  };

  public query ({ caller }) func adminGetAllDeposits() : async [DepositRecord] {
    requireAdmin(caller);
    deposits.values().toArray()
  };

  public query ({ caller }) func adminGetPendingDeposits() : async [DepositRecord] {
    requireAdmin(caller);
    deposits.values().toArray().filter(func(d : DepositRecord) : Bool { d.status == #Pending })
  };

  public shared ({ caller }) func adminApproveDeposit(depositId : Nat, adminNote : Text) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (deposits.get(depositId)) {
      case (null) { return #err("Deposit not found") };
      case (?dep) {
        if (dep.status != #Pending) { return #err("Deposit is not pending") };
        switch (users.get(dep.userId)) {
          case (null) { return #err("User not found") };
          case (?user) {
            var newBalance = user.coinBalance + dep.amount;
            var referralBonusPaid = user.referralBonusPaid;
            var planDay = user.planDay;
            var planStartDay = user.planStartDay;

            if (planDay == 0) {
              planDay := 1;
              planStartDay := nowSec() / 86400;
            };

            if (not referralBonusPaid and dep.amount >= 100.0) {
              newBalance += 5.0;
              referralBonusPaid := true;
              switch (user.referredBy) {
                case (?refCode) {
                  switch (referralIndex.get(refCode)) {
                    case (?referrerId) {
                      switch (users.get(referrerId)) {
                        case (?referrer) {
                          let ts = teamSizeOf(referrer.referralCode);
                          users.add(referrerId, { referrer with
                            coinBalance = referrer.coinBalance + 10.0;
                            teamRewardEligible = ts + 1 >= 100;
                          });
                        };
                        case (null) {};
                      };
                    };
                    case (null) {};
                  };
                };
                case (null) {};
              };
            };

            users.add(dep.userId, { user with coinBalance = newBalance; referralBonusPaid; planDay; planStartDay });
            deposits.add(depositId, { dep with status = #Approved; note = adminNote });
            #ok
          };
        };
      };
    }
  };

  public shared ({ caller }) func adminRejectDeposit(depositId : Nat, adminNote : Text) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (deposits.get(depositId)) {
      case (null) { return #err("Deposit not found") };
      case (?dep) {
        if (dep.status != #Pending) { return #err("Deposit is not pending") };
        deposits.add(depositId, { dep with status = #Rejected; note = adminNote });
        #ok
      };
    }
  };

  public shared ({ caller }) func adminAdjustCoins(userId : Principal, delta : Float, _reason : Text) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (users.get(userId)) {
      case (null) { return #err("User not found") };
      case (?user) {
        let newBalance = user.coinBalance + delta;
        if (newBalance < 0.0) { return #err("Balance would go negative") };
        users.add(userId, { user with coinBalance = newBalance });
        #ok
      };
    }
  };

  public query ({ caller }) func adminGetAllWithdrawals() : async [WithdrawalRecord] {
    requireAdmin(caller);
    withdrawals.values().toArray()
  };

  public query ({ caller }) func adminGetPendingWithdrawals() : async [WithdrawalRecord] {
    requireAdmin(caller);
    withdrawals.values().toArray().filter(func(w : WithdrawalRecord) : Bool { w.status == #Pending })
  };

  public shared ({ caller }) func adminApproveWithdrawal(withdrawalId : Nat) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (withdrawals.get(withdrawalId)) {
      case (null) { return #err("Withdrawal not found") };
      case (?wd) {
        if (wd.status != #Pending) { return #err("Withdrawal is not pending") };
        withdrawals.add(withdrawalId, { wd with status = #Approved });
        #ok
      };
    }
  };

  public shared ({ caller }) func adminRejectWithdrawal(withdrawalId : Nat) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (withdrawals.get(withdrawalId)) {
      case (null) { return #err("Withdrawal not found") };
      case (?wd) {
        if (wd.status != #Pending) { return #err("Withdrawal is not pending") };
        switch (users.get(wd.userId)) {
          case (?user) { users.add(wd.userId, { user with coinBalance = user.coinBalance + wd.amount }) };
          case (null) {};
        };
        withdrawals.add(withdrawalId, { wd with status = #Rejected });
        #ok
      };
    }
  };

  // ─── ADS MANAGEMENT ───────────────────────────────────────────────────────

  public query func getActiveAds() : async [AdRecord] {
    ads.values().toArray().filter(func(a : AdRecord) : Bool { a.active })
  };

  public query ({ caller }) func adminGetAllAds() : async [AdRecord] {
    requireAdmin(caller);
    ads.values().toArray()
  };

  public shared ({ caller }) func adminAddAd(title : Text, url : Text) : async Nat {
    requireAdmin(caller);
    let id = nextAdId;
    nextAdId += 1;
    ads.add(id, { id; title; url; active = true });
    id
  };

  public shared ({ caller }) func adminToggleAd(adId : Nat) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (ads.get(adId)) {
      case (null) { #err("Ad not found") };
      case (?ad) {
        ads.add(adId, { ad with active = not ad.active });
        #ok
      };
    }
  };

  public shared ({ caller }) func adminRemoveAd(adId : Nat) : async { #ok; #err : Text } {
    requireAdmin(caller);
    switch (ads.get(adId)) {
      case (null) { #err("Ad not found") };
      case (?_) {
        ads.remove(adId);
        #ok
      };
    }
  };

  // ─── STATS ────────────────────────────────────────────────────────────────

  public query ({ caller }) func adminGetStats() : async AppStats {
    requireAdmin(caller);
    var pendingDep = 0;
    var pendingWd = 0;
    for ((_, d) in deposits.entries()) {
      if (d.status == #Pending) { pendingDep += 1 }
    };
    for ((_, w) in withdrawals.entries()) {
      if (w.status == #Pending) { pendingWd += 1 }
    };
    {
      totalUsers = users.size();
      totalDeposits = deposits.size();
      totalWithdrawals = withdrawals.size();
      pendingDeposits = pendingDep;
      pendingWithdrawals = pendingWd;
    }
  };
}
