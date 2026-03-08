import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle,
  Copy,
  Loader2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitDeposit } from "../hooks/useQueries";
import type { PaymentMethod } from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";

const PAYMENT_METHODS = [
  {
    value: "Easypaisa",
    label: "Easypaisa",
    account: "0311-4567890",
    accountName: "Muhammad Argun",
    emoji: "📱",
  },
  {
    value: "JazzCash",
    label: "JazzCash",
    account: "0322-9876543",
    accountName: "Muhammad Argun",
    emoji: "💚",
  },
  {
    value: "BankTransfer",
    label: "Bank Transfer",
    account: "PK12ABCD0000001234567890",
    accountName: "Argun Ventures Ltd — MCB Bank",
    emoji: "🏦",
  },
];

export default function DepositPage() {
  const submitDeposit = useSubmitDeposit();
  const { createStorageClient } = useStorageClient();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotHash, setScreenshotHash] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.value === method);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setScreenshotFile(file);
    setScreenshotHash("");

    setIsUploading(true);
    try {
      const storageClient = await createStorageClient("deposits");
      if (!storageClient) {
        toast.error("Please ensure you are logged in");
        setIsUploading(false);
        return;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (p) => {
        setUploadProgress(p);
      });

      setScreenshotHash(hash);
      toast.success("Screenshot uploaded successfully!");
    } catch {
      toast.error("Upload failed. Please try again.");
      setScreenshotFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum < 100) {
      toast.error("Minimum deposit is 100 PKR");
      return;
    }
    if (!method) {
      toast.error("Please select a payment method");
      return;
    }
    if (!screenshotHash) {
      toast.error("Please upload your payment screenshot");
      return;
    }

    const paymentMethod: PaymentMethod =
      method === "Easypaisa"
        ? { Easypaisa: null }
        : method === "JazzCash"
          ? { JazzCash: null }
          : { BankTransfer: null };

    try {
      const result = await submitDeposit.mutateAsync({
        amount: amountNum,
        method: paymentMethod,
        screenshotHash,
      });

      if ("ok" in result) {
        toast.success("Deposit request submitted! Admin will verify shortly.");
        setAmount("");
        setMethod("");
        setScreenshotFile(null);
        setScreenshotHash("");
        setUploadProgress(0);
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to submit deposit. Please try again.");
    }
  };

  const copyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Account number copied!");
  };

  return (
    <div className="min-h-dvh px-4 pt-5 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "oklch(0.68 0.18 150 / 0.15)",
            border: "1px solid oklch(0.68 0.18 150 / 0.3)",
          }}
        >
          <ArrowDownToLine className="w-5 h-5 text-success" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Deposit
          </h1>
          <p className="text-muted-foreground text-xs">
            Min. 100 PKR · 1 PKR = 1 Coin
          </p>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Amount */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Amount (PKR)
          </Label>
          <div className="relative">
            <Input
              data-ocid="deposit.amount_input"
              type="number"
              min="100"
              step="1"
              placeholder="Enter amount (min 100)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-xl font-display font-bold bg-secondary/50 border-border focus:border-gold-mid/50 pr-16"
              style={{ fontSize: "18px" }}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-medium">
              PKR
            </div>
          </div>
          {amount && Number.parseFloat(amount) >= 100 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gold-mid font-medium"
            >
              = {Number.parseFloat(amount).toLocaleString()} coins after deposit
            </motion.p>
          )}
          {amount && Number.parseFloat(amount) < 100 && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Minimum deposit is 100 PKR
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Payment Method
          </Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger
              data-ocid="deposit.method_select"
              className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 text-base"
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent
              className="rounded-xl"
              style={{
                background: "oklch(0.18 0.03 265)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              {PAYMENT_METHODS.map((m) => (
                <SelectItem
                  key={m.value}
                  value={m.value}
                  className="text-base py-3"
                >
                  {m.emoji} {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment instructions */}
          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl p-4 space-y-2"
              style={{
                background: "oklch(0.68 0.18 150 / 0.06)",
                border: "1px solid oklch(0.68 0.18 150 / 0.2)",
              }}
            >
              <p className="text-xs text-success/80 font-medium uppercase tracking-wider">
                Payment Instructions
              </p>
              <Separator className="bg-success/10" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Send to:</p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {selectedMethod.account}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMethod.accountName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyAccount(selectedMethod.account)}
                    className="p-2 rounded-lg bg-success/10 hover:bg-success/20 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-success" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 After payment, upload the screenshot below
              </p>
            </motion.div>
          )}
        </div>

        {/* Screenshot Upload */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Payment Screenshot
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />

          {!screenshotFile ? (
            <button
              type="button"
              data-ocid="deposit.upload_button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-98"
              style={{
                background: "oklch(0.78 0.16 70 / 0.04)",
                border: "2px dashed oklch(0.78 0.16 70 / 0.25)",
              }}
            >
              <Upload className="w-6 h-6 text-gold-mid/60" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Upload screenshot
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  JPG, PNG, WEBP · Max 5MB
                </p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl overflow-hidden"
            >
              <img
                src={URL.createObjectURL(screenshotFile)}
                alt="Payment screenshot"
                className="w-full max-h-48 object-cover rounded-xl"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-mid" />
                      <span className="text-xs text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </span>
                    </>
                  ) : screenshotHash ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs text-success font-medium">
                        Uploaded
                      </span>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotHash("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          data-ocid="deposit.submit_button"
          disabled={
            submitDeposit.isPending ||
            isUploading ||
            !screenshotHash ||
            !amount ||
            !method ||
            Number.parseFloat(amount) < 100
          }
          className="w-full h-14 text-base font-display font-bold rounded-xl"
          style={
            !submitDeposit.isPending &&
            screenshotHash &&
            amount &&
            method &&
            Number.parseFloat(amount) >= 100
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
                  color: "oklch(0.12 0.01 265)",
                  boxShadow: "0 4px 20px oklch(0.74 0.16 68 / 0.35)",
                }
              : {}
          }
        >
          {submitDeposit.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Deposit Request"
          )}
        </Button>
      </motion.form>
    </div>
  );
}
