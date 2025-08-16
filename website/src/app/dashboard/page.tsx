'use client';
import { Layout } from '@/components/Dashboard/Layout';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/welcome');
  }, [router]);

  return (
    <Layout hiddenSidebar>
      <></>
    </Layout>
  );
}
