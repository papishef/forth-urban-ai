import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, BuildingLoader } from "@forth-urban/ui";
import { useAdminStoragePaymentVerification } from "./admin-api";
import { AdminLayout } from "./admin-layout";
import { getErrorMessage } from "../../lib/api-error";

export function StorageCheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get("transaction_id") ?? "";
  const txRef = searchParams.get("tx_ref") ?? undefined;
  const verification = useAdminStoragePaymentVerification(transactionId, txRef);

  return (
    <AdminLayout title="Storage payment">
      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden border-white/80 bg-white/70 shadow-lg shadow-[#5C4033]/10">
          <CardHeader className="border-b border-[#181818]/10">
            <CardTitle>Storage plan checkout</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            {!transactionId ? (
              <>
                <CircleAlert className="h-12 w-12 text-amber-600" />
                <h2 className="font-heading text-xl font-semibold text-[#181818]">Payment reference missing</h2>
                <p className="text-sm text-[#181818]/65">We could not verify this return. Your account was not changed.</p>
              </>
            ) : verification.isPending ? (
              <>
                <BuildingLoader size="sm" label="Confirming payment securely…" />
                <p className="text-sm text-[#181818]/60">Flutterwave is confirming the amount and recurring plan.</p>
              </>
            ) : verification.isSuccess ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h2 className="font-heading text-xl font-semibold text-[#181818]">Storage upgraded</h2>
                <p className="text-sm text-[#181818]/65">Your new allowance is active and automatic monthly renewal is enabled.</p>
              </>
            ) : (
              <>
                <CircleAlert className="h-12 w-12 text-red-600" />
                <h2 className="font-heading text-xl font-semibold text-[#181818]">Payment needs attention</h2>
                <p className="text-sm text-[#181818]/65">{getErrorMessage(verification.error, "We could not confirm this payment. Your account was not changed.")}</p>
              </>
            )}
            <Link
              to="/admin/settings"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#5C4033] px-5 text-sm font-medium text-white shadow-lg shadow-[#5C4033]/20 transition hover:bg-[#4a3329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]"
            >
              Back to storage settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}