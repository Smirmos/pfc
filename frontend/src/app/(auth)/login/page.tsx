'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to your PFC Advisor account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={loginWithGoogle}
          sx={{ mb: 3 }}
        >
          Continue with Google
        </Button>

        <Typography variant="body2" textAlign="center" color="text.secondary">
          Don&apos;t have an account?{' '}
          <Typography
            component={Link}
            href="/register"
            variant="body2"
            color="primary"
            fontWeight={600}
            sx={{ textDecoration: 'none' }}
          >
            Sign up
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );
}
