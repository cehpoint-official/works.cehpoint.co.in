// pages/payments.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User, Payment, Currency } from "../utils/types";

import { format } from "date-fns";
import { DollarSign, TrendingUp, Download } from "lucide-react";

const INR_RATE = 89; // 🔹 base: 1 USD ≈ 90.14 INR (example)

// Format helpers
function formatMoney(amountUsd: number, currency: Currency): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toFixed(2)}`;
}

function toDisplay(amountUsd: number, currency: Currency): number {
  return currency === "INR" ? amountUsd * INR_RATE : amountUsd;
}

function toBase(enteredAmount: number, currency: Currency): number {
  return currency === "INR" ? enteredAmount / INR_RATE : enteredAmount;
}

export default function Payments() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // payout details state
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutType, setPayoutType] = useState<
    "upi" | "bank" | "paypal" | "crypto"
  >("upi");

  const [upiId, setUpiId] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  const [paypalEmail, setPaypalEmail] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");

  const [withdrawMethod, setWithdrawMethod] = useState<
    "upi" | "bank" | "paypal" | "crypto"
  >("upi");

  // 🔹 display currency state
  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  /* ----------------------------------------
   * LOAD USER + PAYMENTS
   * --------------------------------------*/
  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== "worker") {
      router.replace("/login");
      return;
    }

    hydratePayoutState(currentUser);
    setUser(currentUser);
    setCurrency(currentUser.preferredCurrency || "USD");
    loadPayments(currentUser.id);
  }, [router]);

  const hydratePayoutState = (u: User) => {
    if (!u.payoutAccount) return;

    if (u.payoutAccount.accountType === "bank") {
      setPayoutType("bank");
      setWithdrawMethod("bank");
    } else if (u.payoutAccount.accountType === "paypal") {
      setPayoutType("paypal");
      setWithdrawMethod("paypal");
    } else if (u.payoutAccount.accountType === "crypto") {
      setPayoutType("crypto");
      setWithdrawMethod("crypto");
    } else {
      setPayoutType("upi");
      setWithdrawMethod("upi");
    }

    setUpiId(u.payoutAccount.upiId ?? "");
    setBankHolderName(u.payoutAccount.accountHolderName ?? "");
    setBankName(u.payoutAccount.bankName ?? "");
    setBankAccountNumber(u.payoutAccount.bankAccountNumber ?? "");
    setBankIfsc(u.payoutAccount.bankIfsc ?? "");

    setPaypalEmail(u.payoutAccount.paypalEmail ?? "");
    setCryptoNetwork(u.payoutAccount.cryptoNetwork ?? "");
    setCryptoAddress(u.payoutAccount.cryptoAddress ?? "");
  };

  const loadPayments = async (userId: string) => {
    setLoading(true);
    try {
      const list = await storage.getPaymentsByUser(userId);
      setPayments(
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      const updatedUser = await storage.getUserById(userId);
      if (updatedUser) {
        setUser(updatedUser);
        setCurrency(updatedUser.preferredCurrency || "USD");
        hydratePayoutState(updatedUser);
        storage.setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * HANDLE CURRENCY CHANGE (PERSIST)
   * --------------------------------------*/
  const handleCurrencyChange = async (value: Currency) => {
    if (!user) return;
    if (value === currency) return;

    setCurrency(value);
    setUpdatingCurrency(true);

    try {
      const updatedUser: User = {
        ...user,
        preferredCurrency: value,
      };

      await storage.updateUser(user.id, { preferredCurrency: value });
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update currency preference:", err);
      toast.error("Failed to update currency preference.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  /* ----------------------------------------
   * SAVE / UPDATE PAYOUT DETAILS
   * --------------------------------------*/
  const handleSavePayoutDetails = async () => {
    if (!user) return;

    try {
      setSavingPayout(true);

      // validate based on type
      if (payoutType === "upi") {
        if (!upiId.trim()) {
          toast.error("Please enter a valid UPI ID");
          setSavingPayout(false);
          return;
        }
      } else if (payoutType === "bank") {
        if (
          !bankHolderName.trim() ||
          !bankName.trim() ||
          !bankAccountNumber.trim() ||
          !bankIfsc.trim()
        ) {
          toast.error("Please fill all bank details");
          setSavingPayout(false);
          return;
        }
      } else if (payoutType === "paypal") {
        if (!paypalEmail.trim()) {
          toast.error("Please enter your PayPal email");
          setSavingPayout(false);
          return;
        }
      } else if (payoutType === "crypto") {
        if (!cryptoNetwork.trim() || !cryptoAddress.trim()) {
          toast.error("Please fill crypto network and address");
          setSavingPayout(false);
          return;
        }
      }

      // build payoutAccount object
      let payoutAccount: any;

      if (payoutType === "upi") {
        payoutAccount = {
          accountType: "upi" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: upiId.trim(),
          upiId: upiId.trim(),
        };
      } else if (payoutType === "bank") {
        payoutAccount = {
          accountType: "bank" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: bankAccountNumber.trim(),
          accountHolderName: bankHolderName.trim(),
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankIfsc: bankIfsc.trim(),
        };
      } else if (payoutType === "paypal") {
        payoutAccount = {
          accountType: "paypal" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: paypalEmail.trim(),
          paypalEmail: paypalEmail.trim(),
        };
      } else {
        // crypto
        payoutAccount = {
          accountType: "crypto" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: cryptoAddress.trim(),
          cryptoNetwork: cryptoNetwork.trim(),
          cryptoAddress: cryptoAddress.trim(),
        };
      }

      await storage.updateUser(user.id, { payoutAccount });

      const updatedUser: User = {
        ...user,
        payoutAccount,
      };

      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      setWithdrawMethod(payoutType);
      setShowPayoutForm(false);

      toast.success("Payout details saved successfully.");
    } catch (err) {
      console.error("Failed to save payout details:", err);
      toast.error("Failed to save payout details.");
    } finally {
      setSavingPayout(false);
    }
  };

  /* ----------------------------------------
   * HANDLE WITHDRAWAL (REQUEST ONLY)
   * --------------------------------------*/
  const handleWithdraw = async () => {
    if (!user) return;

    const enteredDisplayAmount = parseFloat(withdrawAmount);

    if (isNaN(enteredDisplayAmount) || enteredDisplayAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    // 🔹 convert from display currency back to USD (base)
    const baseAmount = toBase(enteredDisplayAmount, currency);

    if (baseAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }

    const pa = user.payoutAccount;
    const hasUpi = !!pa?.upiId;
    const hasBank = !!pa?.bankAccountNumber;
    const hasPaypal = !!pa?.paypalEmail;
    const hasCrypto = !!pa?.cryptoAddress;

    if (!pa || (!hasUpi && !hasBank && !hasPaypal && !hasCrypto)) {
      toast.error("Please add payout details before requesting a withdrawal.");
      return;
    }

    if (withdrawMethod === "upi" && !hasUpi) {
      toast.error("You have not added a UPI ID yet.");
      return;
    }

    if (withdrawMethod === "bank" && !hasBank) {
      toast.error("You have not added bank details yet.");
      return;
    }

    if (withdrawMethod === "paypal" && !hasPaypal) {
      toast.error("You have not added a PayPal email yet.");
      return;
    }

    if (withdrawMethod === "crypto" && !hasCrypto) {
      toast.error("You have not added a crypto address yet.");
      return;
    }

    let payoutMethodDetails = "";

    if (withdrawMethod === "upi") {
      payoutMethodDetails = pa!.upiId || "";
    } else if (withdrawMethod === "bank") {
      payoutMethodDetails = `${pa!.bankName ?? ""} - ${pa!.bankAccountNumber}`;
    } else if (withdrawMethod === "paypal") {
      payoutMethodDetails = `PayPal: ${pa!.paypalEmail}`;
    } else if (withdrawMethod === "crypto") {
      payoutMethodDetails = `Crypto: ${pa!.cryptoNetwork ?? ""} - ${pa!.cryptoAddress ?? ""
        }`;
    }

    setSubmitting(true);

    try {
      const paymentPayload: Omit<Payment, "id"> = {
        userId: user.id,
        amount: baseAmount, // 🔹 store in BASE (USD)
        type: "withdrawal",
        status: "pending", // admin will approve
        createdAt: new Date().toISOString(),
        payoutMethod: withdrawMethod,
        payoutMethodDetails,
      };

      await storage.createPayment(paymentPayload);

      // Notify Admins
      const allUsers = await storage.getUsers();
      const admins = allUsers.filter(u => u.role === 'admin');

      await Promise.all(admins.map(admin =>
        storage.createNotification({
          userId: admin.id,
          title: "New Payout Request",
          message: `${user.fullName} requested ${formatMoney(baseAmount, "USD")} withdrawal via ${withdrawMethod.toUpperCase()}.`,
          type: "warning",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/admin/workers"
        })
      )).catch(e => console.error("Admin notification failed", e));

      toast.success("Withdrawal request sent to admin for approval.");

      setWithdrawAmount("");
      setShowWithdraw(false);
      await loadPayments(user.id);
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error("Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const totalEarnings = payments
    .filter((p) => p.type === "task-payment" && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalWithdrawn = payments
    .filter((p) => p.type === "withdrawal" && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const hasUpi = !!user.payoutAccount?.upiId;
  const hasBank = !!user.payoutAccount?.bankAccountNumber;
  const hasPaypal = !!user.payoutAccount?.paypalEmail;
  const hasCrypto = !!user.payoutAccount?.cryptoAddress;

  const displayBalance = toDisplay(user.balance, currency);

  return (
    <Layout>
      <Head>
        <title>Payments - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* HEADER + CURRENCY SELECT */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Payments &amp; Earnings
          </h1>


          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Display currency:</span>
            <select
              value={currency}
              onChange={(e) =>
                handleCurrencyChange(e.target.value as Currency)
              }
              disabled={updatingCurrency}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <Button onClick={() => setShowWithdraw((s) => !s)}> <Download size={18} /> <span className="">Withdraw</span> </Button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatMoney(user.balance, currency)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Available Balance</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatMoney(totalEarnings, currency)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Earned</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatMoney(totalWithdrawn, currency)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Withdrawn</p>
          </Card>
        </div>

        {/* WITHDRAW SECTION */}
        {showWithdraw && (
          <Card className="bg-indigo-50">
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ({currency === "INR" ? "₹" : "$"})
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  placeholder={`Enter amount in ${currency}`}
                  max={displayBalance}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Available: {formatMoney(user.balance, currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Withdraw To
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("upi")}
                    className={`px-4 py-2 rounded-lg border ${withdrawMethod === "upi"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                    disabled={!hasUpi}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("bank")}
                    className={`px-4 py-2 rounded-lg border ${withdrawMethod === "bank"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                    disabled={!hasBank}
                  >
                    Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("paypal")}
                    className={`px-4 py-2 rounded-lg border ${withdrawMethod === "paypal"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                    disabled={!hasPaypal}
                  >
                    PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("crypto")}
                    className={`px-4 py-2 rounded-lg border ${withdrawMethod === "crypto"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                    disabled={!hasCrypto}
                  >
                    Crypto
                  </button>
                </div>
                {!hasUpi && !hasBank && !hasPaypal && !hasCrypto && (
                  <p className="text-xs text-red-600 mt-1">
                    Add payout details first to withdraw.
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleWithdraw} disabled={submitting}>
                  {submitting ? "Processing…" : "Request Withdrawal"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWithdraw(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* PAYOUT DETAILS SECTION */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Payout Details</h2>
            <Button
              variant="outline"
              onClick={() => setShowPayoutForm((s) => !s)}
            >
              {showPayoutForm ? "Close" : user.payoutAccount ? "Edit" : "Add"}
            </Button>
          </div>

          {!user.payoutAccount && !showPayoutForm && (
            <p className="text-sm text-gray-600">
              No payout details added yet. Click &quot;Add&quot; to set up UPI,
              bank, PayPal, or crypto account.
            </p>
          )}

          {user.payoutAccount && !showPayoutForm && (
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Type:</span>{" "}
                {user.payoutAccount.accountType === "upi"
                  ? "UPI"
                  : user.payoutAccount.accountType === "bank"
                    ? "Bank"
                    : user.payoutAccount.accountType === "paypal"
                      ? "PayPal"
                      : "Crypto"}
              </p>

              {user.payoutAccount.accountType === "upi" && (
                <p>
                  <span className="font-medium">UPI ID:</span>{" "}
                  {user.payoutAccount.upiId}
                </p>
              )}

              {user.payoutAccount.accountType === "bank" && (
                <>
                  <p>
                    <span className="font-medium">Account Holder:</span>{" "}
                    {user.payoutAccount.accountHolderName}
                  </p>
                  <p>
                    <span className="font-medium">Bank:</span>{" "}
                    {user.payoutAccount.bankName}
                  </p>
                  <p>
                    <span className="font-medium">Account Number:</span>{" "}
                    {user.payoutAccount.bankAccountNumber}
                  </p>
                  <p>
                    <span className="font-medium">IFSC:</span>{" "}
                    {user.payoutAccount.bankIfsc}
                  </p>
                </>
              )}

              {user.payoutAccount.accountType === "paypal" && (
                <p>
                  <span className="font-medium">PayPal Email:</span>{" "}
                  {user.payoutAccount.paypalEmail}
                </p>
              )}

              {user.payoutAccount.accountType === "crypto" && (
                <>
                  <p>
                    <span className="font-medium">Network:</span>{" "}
                    {user.payoutAccount.cryptoNetwork}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {user.payoutAccount.cryptoAddress}
                  </p>
                </>
              )}

              <p>
                <span className="font-medium">Status:</span>{" "}
                {user.payoutAccount.verified ? "Verified" : "Not Verified"}
              </p>
            </div>
          )}

          {showPayoutForm && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payout Type
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutType("upi")}
                    className={`px-4 py-2 rounded-lg border ${payoutType === "upi"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType("bank")}
                    className={`px-4 py-2 rounded-lg border ${payoutType === "bank"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                  >
                    Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType("paypal")}
                    className={`px-4 py-2 rounded-lg border ${payoutType === "paypal"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                  >
                    PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType("crypto")}
                    className={`px-4 py-2 rounded-lg border ${payoutType === "crypto"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300"
                      }`}
                  >
                    Crypto
                  </button>
                </div>
              </div>

              {payoutType === "upi" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="your-upi@bank"
                  />
                </div>
              )}

              {payoutType === "bank" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {payoutType === "paypal" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              {payoutType === "crypto" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Crypto Network
                    </label>
                    <input
                      type="text"
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="e.g., Ethereum, Solana, Polygon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="0x..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button onClick={handleSavePayoutDetails} disabled={savingPayout}>
                  {savingPayout ? "Saving…" : "Save Payout Details"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPayoutForm(false)}
                  disabled={savingPayout}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* TRANSACTION HISTORY */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          {payments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const isWithdrawal = payment.type === "withdrawal";
                const isTaskPayment = payment.type === "task-payment";

                const statusLabel =
                  isWithdrawal && payment.status === "pending"
                    ? "Pending admin/processing"
                    : payment.status;

                return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {isTaskPayment ? "Task Payment" : "Withdrawal"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(payment.createdAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </p>
                      {payment.payoutMethodDetails && isWithdrawal && (
                        <p className="text-xs text-gray-500 mt-1">
                          To: {payment.payoutMethodDetails}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${isTaskPayment ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {isTaskPayment ? "+" : "-"}
                        {formatMoney(payment.amount, currency)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${payment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}