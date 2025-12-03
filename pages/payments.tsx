// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import Head from "next/head";

// import Layout from "../components/Layout";
// import Card from "../components/Card";
// import Button from "../components/Button";

// import { storage } from "../utils/storage";
// import type { User, Payment } from "../utils/types";

// import { format } from "date-fns";
// import { DollarSign, TrendingUp, Download } from "lucide-react";

// export default function Payments() {
//   const router = useRouter();

//   const [user, setUser] = useState<User | null>(null);
//   const [payments, setPayments] = useState<Payment[]>([]);
//   const [withdrawAmount, setWithdrawAmount] = useState("");
//   const [showWithdraw, setShowWithdraw] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);

//   /* ----------------------------------------
//    * LOAD USER + PAYMENTS
//    * --------------------------------------*/
//   useEffect(() => {
//     const currentUser = storage.getCurrentUser();

//     if (!currentUser || currentUser.role !== "worker") {
//       router.replace("/login");
//       return;
//     }

//     setUser(currentUser);
//     loadPayments(currentUser.id);
//   }, [router]);

//   const loadPayments = async (userId: string) => {
//     setLoading(true);
//     try {
//       // Load payment history
//       const list = await storage.getPaymentsByUser(userId);
//       setPayments(
//         list.sort(
//           (a, b) =>
//             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         )
//       );

//       // Load updated user balance from Firestore
//       const updatedUser = await storage.getUserById(userId);
//       if (updatedUser) {
//         setUser(updatedUser);
//         storage.setCurrentUser(updatedUser); // sync session
//       }
//     } catch (err) {
//       console.error("Failed to load payments:", err);
//       alert("Failed to load payments.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ----------------------------------------
//    * HANDLE WITHDRAWAL
//    * --------------------------------------*/
//   const handleWithdraw = async () => {
//     if (!user) return;

//     const amount = parseFloat(withdrawAmount);

//     if (isNaN(amount) || amount <= 0) {
//       alert("Enter a valid amount");
//       return;
//     }

//     if (amount > user.balance) {
//       alert("Insufficient balance");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       // Create withdrawal payment record
//       const paymentPayload: Omit<Payment, "id"> = {
//         userId: user.id,
//         amount,
//         type: "withdrawal",
//         status: "pending", // admin will approve / complete
//         createdAt: new Date().toISOString(),
//       };

//       await storage.createPayment(paymentPayload);

//       // If payout account is verified → deduct immediately
//       if (user.payoutAccount?.verified) {
//         const newBalance = user.balance - amount;

//         await storage.updateUser(user.id, {
//           balance: newBalance,
//         });

//         const updatedUser: User = {
//           ...user,
//           balance: newBalance,
//         };

//         storage.setCurrentUser(updatedUser);
//         setUser(updatedUser);

//         alert("Withdrawal request submitted!");
//       } else {
//         // Not verified → admin must approve
//         alert("Withdrawal request sent to admin for approval.");
//       }

//       setWithdrawAmount("");
//       setShowWithdraw(false);
//       await loadPayments(user.id);
//     } catch (err) {
//       console.error("Withdrawal error:", err);
//       alert("Failed to submit withdrawal request.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading || !user) return null;

//   const totalEarnings = payments
//     .filter((p) => p.type === "task-payment" && p.status === "completed")
//     .reduce((sum, p) => sum + p.amount, 0);

//   const totalWithdrawn = payments
//     .filter((p) => p.type === "withdrawal" && p.status === "completed")
//     .reduce((sum, p) => sum + p.amount, 0);

//   return (
//     <Layout>
//       <Head>
//         <title>Payments - Cehpoint</title>
//       </Head>

//       <div className="space-y-6">
//         {/* HEADER */}
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900">
//             Payments &amp; Earnings
//           </h1>
//           <Button onClick={() => setShowWithdraw((s) => !s)}>
//             <Download size={18} />
//             <span>Withdraw</span>
//           </Button>
//         </div>

//         {/* SUMMARY CARDS */}
//         <div className="grid md:grid-cols-3 gap-6">
//           <Card className="text-center">
//             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
//               <DollarSign size={24} />
//             </div>
//             <p className="text-3xl font-bold text-gray-900">
//               ${user.balance.toFixed(2)}
//             </p>
//             <p className="text-sm text-gray-600 mt-1">Available Balance</p>
//           </Card>

//           <Card className="text-center">
//             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
//               <TrendingUp size={24} />
//             </div>
//             <p className="text-3xl font-bold text-gray-900">
//               ${totalEarnings.toFixed(2)}
//             </p>
//             <p className="text-sm text-gray-600 mt-1">Total Earned</p>
//           </Card>

//           <Card className="text-center">
//             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
//               <Download size={24} />
//             </div>
//             <p className="text-3xl font-bold text-gray-900">
//               ${totalWithdrawn.toFixed(2)}
//             </p>
//             <p className="text-sm text-gray-600 mt-1">Total Withdrawn</p>
//           </Card>
//         </div>

//         {/* WITHDRAW SECTION */}
//         {showWithdraw && (
//           <Card className="bg-indigo-50">
//             <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Amount ($)
//                 </label>
//                 <input
//                   type="number"
//                   value={withdrawAmount}
//                   onChange={(e) => setWithdrawAmount(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                   placeholder="Enter amount"
//                   max={user.balance}
//                 />
//                 <p className="text-sm text-gray-600 mt-1">
//                   Available: ${user.balance.toFixed(2)}
//                 </p>
//               </div>

//               {!user.payoutAccount?.verified && (
//                 <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
//                   <p className="text-sm text-yellow-800">
//                     Your payout account is not verified. Withdrawal requests
//                     will be sent to the admin for approval.
//                   </p>
//                 </div>
//               )}

//               <div className="flex space-x-3">
//                 <Button onClick={handleWithdraw} disabled={submitting}>
//                   {submitting ? "Processing…" : "Confirm Withdrawal"}
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowWithdraw(false)}
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         )}

//         {/* TRANSACTION HISTORY */}
//         <Card>
//           <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
//           {payments.length === 0 ? (
//             <p className="text-center text-gray-500 py-8">
//               No transactions yet
//             </p>
//           ) : (
//             <div className="space-y-3">
//               {payments.map((payment) => {
//                 const isWithdrawal = payment.type === "withdrawal";
//                 const isTaskPayment = payment.type === "task-payment";

//                 const statusLabel =
//                   isWithdrawal && payment.status === "pending"
//                     ? "Pending admin/processing"
//                     : payment.status;

//                 return (
//                   <div
//                     key={payment.id}
//                     className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
//                   >
//                     <div>
//                       <p className="font-medium">
//                         {isTaskPayment ? "Task Payment" : "Withdrawal"}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         {format(
//                           new Date(payment.createdAt),
//                           "MMM dd, yyyy HH:mm"
//                         )}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p
//                         className={`font-semibold ${
//                           isTaskPayment ? "text-green-600" : "text-red-600"
//                         }`}
//                       >
//                         {isTaskPayment ? "+" : "-"}$
//                         {payment.amount.toFixed(2)}
//                       </p>
//                       <span
//                         className={`text-xs px-2 py-1 rounded ${
//                           payment.status === "completed"
//                             ? "bg-green-100 text-green-700"
//                             : payment.status === "pending"
//                             ? "bg-yellow-100 text-yellow-700"
//                             : "bg-red-100 text-red-700"
//                         }`}
//                       >
//                         {statusLabel}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </Card>
//       </div>
//     </Layout>
//   );
// }


















import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User, Payment } from "../utils/types";

import { format } from "date-fns";
import { DollarSign, TrendingUp, Download } from "lucide-react";

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
  const [payoutType, setPayoutType] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank">("upi");

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
    loadPayments(currentUser.id);
  }, [router]);

  const hydratePayoutState = (u: User) => {
    if (!u.payoutAccount) return;

    if (u.payoutAccount.accountType === "bank") {
      setPayoutType("bank");
      setWithdrawMethod("bank");
    } else {
      setPayoutType("upi");
      setWithdrawMethod("upi");
    }

    setUpiId(u.payoutAccount.upiId ?? "");
    setBankHolderName(u.payoutAccount.accountHolderName ?? "");
    setBankName(u.payoutAccount.bankName ?? "");
    setBankAccountNumber(u.payoutAccount.bankAccountNumber ?? "");
    setBankIfsc(u.payoutAccount.bankIfsc ?? "");
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
        hydratePayoutState(updatedUser);
        storage.setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      alert("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * SAVE / UPDATE PAYOUT DETAILS
   * --------------------------------------*/
  const handleSavePayoutDetails = async () => {
    if (!user) return;

    try {
      setSavingPayout(true);

      if (payoutType === "upi") {
        if (!upiId.trim()) {
          alert("Please enter a valid UPI ID");
          return;
        }
      } else {
        if (
          !bankHolderName.trim() ||
          !bankName.trim() ||
          !bankAccountNumber.trim() ||
          !bankIfsc.trim()
        ) {
          alert("Please fill all bank details");
          return;
        }
      }

      let payoutAccount: any;

      if (payoutType === "upi") {
        payoutAccount = {
          accountType: "upi" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: upiId.trim(),
          upiId: upiId.trim(),
          // no bank fields at all here
        };
      } else {
        payoutAccount = {
          accountType: "bank" as const,
          verified: user.payoutAccount?.verified ?? false,
          accountNumber: bankAccountNumber.trim(),
          accountHolderName: bankHolderName.trim(),
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankIfsc: bankIfsc.trim(),
          // no upiId here
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

      alert("Payout details saved successfully.");
    } catch (err) {
      console.error("Failed to save payout details:", err);
      alert("Failed to save payout details.");
    } finally {
      setSavingPayout(false);
    }
  };

  /* ----------------------------------------
   * HANDLE WITHDRAWAL
   * --------------------------------------*/
  const handleWithdraw = async () => {
    if (!user) return;

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    if (amount > user.balance) {
      alert("Insufficient balance");
      return;
    }

    const pa = user.payoutAccount;
    const hasUpi = !!pa?.upiId;
    const hasBank = !!pa?.bankAccountNumber;

    if (!pa || (!hasUpi && !hasBank)) {
      alert("Please add payout details before requesting a withdrawal.");
      return;
    }

    if (withdrawMethod === "upi" && !hasUpi) {
      alert("You have not added a UPI ID yet.");
      return;
    }

    if (withdrawMethod === "bank" && !hasBank) {
      alert("You have not added bank details yet.");
      return;
    }

    const payoutMethodDetails =
      withdrawMethod === "upi"
        ? pa!.upiId!
        : `${pa!.bankName ?? ""} - ${pa!.bankAccountNumber}`;

    setSubmitting(true);

    try {
      const paymentPayload: Omit<Payment, "id"> = {
        userId: user.id,
        amount,
        type: "withdrawal",
        status: "pending",
        createdAt: new Date().toISOString(),
        payoutMethod: withdrawMethod,
        payoutMethodDetails,
      };

      await storage.createPayment(paymentPayload);

      if (user.payoutAccount?.verified) {
        const newBalance = user.balance - amount;

        await storage.updateUser(user.id, {
          balance: newBalance,
        });

        const updatedUser: User = {
          ...user,
          balance: newBalance,
        };

        storage.setCurrentUser(updatedUser);
        setUser(updatedUser);

        alert("Withdrawal request submitted!");
      } else {
        alert("Withdrawal request sent to admin for approval.");
      }

      setWithdrawAmount("");
      setShowWithdraw(false);
      await loadPayments(user.id);
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert("Failed to submit withdrawal request.");
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

  return (
    <Layout>
      <Head>
        <title>Payments - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Payments &amp; Earnings
          </h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPayoutForm((s) => !s)}
            >
              <span>{user.payoutAccount ? "Edit" : "Add"} Payment Details</span>
            </Button>
            <Button onClick={() => setShowWithdraw((s) => !s)}>
              <Download size={18} />
              <span>Withdraw</span>
            </Button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${user.balance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Available Balance</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalEarnings.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Earned</p>
          </Card>

          <Card className="text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalWithdrawn.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Withdrawn</p>
          </Card>
        </div>

        {/* PAYOUT DETAILS FORM */}
        {showPayoutForm && (
          <Card className="bg-white border border-indigo-100">
            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Select Method</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPayoutType("upi")}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${payoutType === "upi"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType("bank")}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${payoutType === "bank"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Bank Account
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    placeholder="yourname@upi"
                  />
                </div>
              )}

              {payoutType === "bank" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) =>
                        setBankAccountNumber(e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSavePayoutDetails}
                  disabled={savingPayout}
                >
                  {savingPayout ? "Saving…" : "Save Details"}
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
          </Card>
        )}

        {/* WITHDRAW SECTION */}
        {showWithdraw && (
          <Card className="bg-indigo-50">
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>

            {!hasUpi && !hasBank && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  You haven&apos;t added any payment details yet. Please add
                  your UPI ID or bank details before requesting a withdrawal.
                </p>
              </div>
            )}

            {(hasUpi || hasBank) && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">
                  Choose withdrawal method
                </p>
                <div className="flex flex-wrap gap-3">
                  {hasUpi && (
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod("upi")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium ${withdrawMethod === "upi"
                          ? "border-indigo-600 bg-white text-indigo-700"
                          : "border-gray-300 text-gray-700 hover:bg-white"
                        }`}
                    >
                      UPI ({user.payoutAccount!.upiId})
                    </button>
                  )}
                  {hasBank && (
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod("bank")}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium ${withdrawMethod === "bank"
                          ? "border-indigo-600 bg_WHITE text-indigo-700"
                          : "border-gray-300 text-gray-700 hover:bg-white"
                        }`}
                    >
                      Bank ({user.payoutAccount!.bankName} ••••
                      {user.payoutAccount!.bankAccountNumber?.slice(-4)})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter amount"
                  max={user.balance}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Available: ${user.balance.toFixed(2)}
                </p>
              </div>

              {!user.payoutAccount?.verified && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your payout account is not verified. Withdrawal requests
                    will be sent to the admin for approval.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleWithdraw}
                  disabled={submitting || (!hasUpi && !hasBank)}
                >
                  {submitting ? "Processing…" : "Confirm Withdrawal"}
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
                      {isWithdrawal && payment.payoutMethod && (
                        <p className="text-xs text-gray-500 mt-1">
                          Method:{" "}
                          {payment.payoutMethod === "upi"
                            ? `UPI (${payment.payoutMethodDetails})`
                            : `Bank (${payment.payoutMethodDetails})`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${isTaskPayment ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {isTaskPayment ? "+" : "-"}$
                        {payment.amount.toFixed(2)}
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
