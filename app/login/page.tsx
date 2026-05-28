'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Redirect will be handled by middleware based on role
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg shadow-blue-100/50 border border-blue-100">
        <div>
          <h2 className="text-center text-2xl font-bold">Acharya Attendance System</h2>
          <p className="text-center text-muted-foreground mt-2">
            Sign in to continue
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm text-center font-medium text-gray-700 mb-4">Quick Mock Login</p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
              onClick={() => onSubmit({ email: 'admin@mock.com', password: 'password123' })}
              type="button"
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
              onClick={() => onSubmit({ email: 'faculty@mock.com', password: 'password123' })}
              type="button"
            >
              Login as Faculty
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
              onClick={() => onSubmit({ email: 'student@mock.com', password: 'password123' })}
              type="button"
            >
              Login as Student
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-4">
            (Requires running <code>sql/seed_mock_users.sql</code> in Supabase first)
          </p>
        </div>
        
        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-gray-100 mt-6">
          <p>
            Don&apos;t have an account? Contact your administrator to get access.
          </p>
        </div>
      </div>
    </div>
  );
}
