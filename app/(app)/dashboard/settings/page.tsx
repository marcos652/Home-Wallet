import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActiveUserRecord } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { EmailIntegrationForm } from "@/components/dashboard/email-integration-form";

export default async function SettingsPage() {
  const user = await requireActiveUserRecord();

  const [accounts, integration] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.emailIntegration.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados de acesso.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar do email</CardTitle>
          <CardDescription>
            Lê os avisos do Nubank no seu Gmail e lança as transações automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailIntegrationForm
            accounts={accounts}
            integration={
              integration
                ? {
                    enabled: integration.enabled,
                    imapUser: integration.imapUser,
                    defaultAccountId: integration.defaultAccountId,
                    lastSyncAt: integration.lastSyncAt,
                    lastSyncError: integration.lastSyncError,
                    hasPassword: integration.imapPasswordEnc.length > 0,
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
