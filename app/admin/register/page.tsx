import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Public admin self-registration is disabled: it was protected only by a code
 * shipped in the client bundle. Admin accounts are provisioned by an existing
 * administrator (see scripts/create-admin-user.ts).
 */
export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Registration</CardTitle>
          <CardDescription>
            Admin accounts can only be created by an existing administrator. Please contact your Coltek Academy
            administrator for access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/admin/login">Go to admin sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to Coltek Academy</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
