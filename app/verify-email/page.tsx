'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/auth/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function VerifyEmailContent() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  const supabase = createClient()

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || type !== 'email') {
        setError('Invalid or missing verification token')
        setVerifying(false)
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess(true)
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [token, type, router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {verifying ? 'Verifying your email address...' : success ? 'Email verified successfully!' : 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your email has been verified successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {!verifying && !success && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The verification link may have expired or is invalid.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
