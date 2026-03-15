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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '@/context/auth-context';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(
        email,
        password,
        firstName || undefined,
        lastName || undefined,
      );
      router.replace('/dashboard');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start making smarter financial decisions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="First name"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              label="Last name"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Stack>
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
            helperText="8-128 characters"
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
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
          Already have an account?{' '}
          <Typography
            component={Link}
            href="/login"
            variant="body2"
            color="primary"
            fontWeight={600}
            sx={{ textDecoration: 'none' }}
          >
            Sign in
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );
}
