import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProfileDTO, UserDTO } from "@forth-urban/shared-types";
import type { ChangePasswordInput, UserProfileUpdateInput } from "@forth-urban/validation";
import { changePasswordSchema, userProfileUpdateSchema } from "@forth-urban/validation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Logo, PageTransition } from "@forth-urban/ui";
import { getErrorMessage } from "../../lib/api-error";
import { hasAdminSurface } from "../../lib/admin-access";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../quiz/quiz-api";
import { AdminLayout } from "../admin/admin-layout";
import { useChangePassword, useUpdateCurrentUser } from "./profile-api";

function AccountForm({ user }: { user: UserDTO }) {
  const updateUser = useUpdateCurrentUser();
  const [success, setSuccess] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileUpdateInput>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      whatsappNumber: user.whatsappNumber ?? "",
      currentCity: user.currentCity ?? "",
      currentCountry: user.currentCountry ?? "",
      isDiaspora: user.isDiaspora,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(null);
    await updateUser.mutateAsync(values);
    setSuccess("Profile details updated.");
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account details</CardTitle>
        <CardDescription>Keep the details used for consultation follow-up current.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-first-name">First name</Label>
            <Input id="profile-first-name" {...register("firstName")} />
            {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-last-name">Last name</Label>
            <Input id="profile-last-name" {...register("lastName")} />
            {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} disabled readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-whatsapp">WhatsApp number</Label>
            <Input id="profile-whatsapp" {...register("whatsappNumber")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-city">Current city</Label>
            <Input id="profile-city" {...register("currentCity")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-country">Current country</Label>
            <Input id="profile-country" {...register("currentCountry")} />
          </div>
          <label className="flex items-center gap-2 self-end text-sm text-[#181818]/75">
            <input type="checkbox" {...register("isDiaspora")} />
            I currently live outside Nigeria
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            {success && <p className="text-sm text-green-700">{success}</p>}
            {updateUser.isError && <p className="text-sm text-red-600">{getErrorMessage(updateUser.error, "Could not update your profile")}</p>}
            <Button type="submit" disabled={isSubmitting || updateUser.isPending} className="w-full sm:w-fit">
              {updateUser.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const changePassword = useChangePassword();
  const [success, setSuccess] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(null);
    await changePassword.mutateAsync(values);
    reset();
    setSuccess("Password updated. Other sessions have been signed out.");
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Use your current password to set a new one. Other active sessions will be revoked.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex max-w-xl flex-col gap-4" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" {...register("currentPassword")} />
            {errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" {...register("newPassword")} />
            {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          {success && <p className="text-sm text-green-700">{success}</p>}
          {changePassword.isError && <p className="text-sm text-red-600">{getErrorMessage(changePassword.error, "Could not update your password")}</p>}
          <Button type="submit" disabled={isSubmitting || changePassword.isPending} className="w-full sm:w-fit">
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileContent({ user, buyerProfile }: { user: UserDTO; buyerProfile: ProfileDTO | null | undefined }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile overview</CardTitle>
          <CardDescription>
            {user.adminAccess ? `${user.adminAccess.title} access` : "Regular user account"} · {user.authProvider} sign-in · {user.emailVerified ? "Email verified" : "Email not verified"} · {user.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buyerProfile ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-[#181818]/55">Buyer goal</dt><dd className="font-medium">{buyerProfile.buyerGoal}</dd></div>
              <div><dt className="text-[#181818]/55">Budget range</dt><dd className="font-medium">{buyerProfile.budgetRange.min.toLocaleString()} – {buyerProfile.budgetRange.max.toLocaleString()}</dd></div>
              <div><dt className="text-[#181818]/55">Preferred area</dt><dd className="font-medium">{buyerProfile.preferredArea}</dd></div>
              <div><dt className="text-[#181818]/55">Readiness score</dt><dd className="font-medium">{buyerProfile.readinessScore}/100</dd></div>
              <div><dt className="text-[#181818]/55">Monthly income</dt><dd className="font-medium">{buyerProfile.monthlyIncome.toLocaleString()}</dd></div>
              <div><dt className="text-[#181818]/55">Payment style</dt><dd className="font-medium">{buyerProfile.paymentStyle}</dd></div>
              <div><dt className="text-[#181818]/55">Timeline</dt><dd className="font-medium">{buyerProfile.timeline}</dd></div>
              <div><dt className="text-[#181818]/55">Buyer persona</dt><dd className="font-medium">{buyerProfile.buyerPersona}</dd></div>
              <div><dt className="text-[#181818]/55">Lead category</dt><dd className="font-medium">{buyerProfile.leadCategory}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-[#181818]/65">Complete the Home-Readiness Quiz to build your buyer profile.</p>
          )}
        </CardContent>
      </Card>
      <AccountForm key={user.id} user={user} />
      <PasswordForm />
    </div>
  );
}

export function ProfileSettingsPage() {
  const { user, logout } = useAuth();
  const { data: buyerProfile } = useProfile(Boolean(user));

  if (!user) return null;

  const content = <ProfileContent user={user} buyerProfile={buyerProfile} />;
  if (hasAdminSurface(user)) {
    return <AdminLayout title="Profile settings">{content}</AdminLayout>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FFECE4] px-4 py-8 lg:py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="flex items-center justify-between">
            <Link to="/" aria-label="Return to home"><Logo className="h-8" /></Link>
            <Button variant="secondary" onClick={() => void logout()}>Log out</Button>
          </header>
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#181818]">Profile settings</h1>
            <p className="mt-1 text-[#181818]/65">Manage your account details and sign-in security.</p>
          </div>
          {content}
        </div>
      </div>
    </PageTransition>
  );
}