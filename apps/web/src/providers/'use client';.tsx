'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/authService';

export const useLogin = () => {
  const [values, setValues] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(values.email, values.password);
    router.replace('/dashboard');
  };

  return { values, handleInputChange, handleSubmit };
};

export const useLoginWithRedirect = () => {
  const [values, setValues] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(values.email, values.password);
    router.replace(new URL('/dashboard', location.origin));
  };

  return { values, handleInputChange, handleSubmit };
};