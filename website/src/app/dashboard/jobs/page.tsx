'use client';

import { clsx } from 'clsx';
import { Layout } from '@/components/Dashboard/Layout';
import { Link } from '@/components/Link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { formatTokenNameAndAmount, tokenIcon, tokensMap } from '@/tokens';
import { PaginationComponent } from '@/components/Pagination';
import useJobs from '@/hooks/subsquid/useJobs';
import moment from 'moment';
import useUsersByAddresses from '@/hooks/subsquid/useUsersByAddresses';
import useUserJobNotifications from '@/hooks/subsquid/useUserJobNotifications';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import useJobsLength from '@/hooks/subsquid/useJobsLength';
import { useState } from 'react';

const environments: Record<string, string> = {
  Preview: 'text-gray-400 bg-gray-400/10 ring-gray-400/20',
  Production: 'text-indigo-400 bg-indigo-400/10 ring-indigo-400/30',
};

const defaultLimit = 10;

export default function OpenJobsPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const { data: jobsCount } = useJobsLength();
  const pages = Math.ceil((jobsCount ?? 0) / defaultLimit);

  const account = useAccount();
  const [now, setNow] = useState(Math.floor(new Date().getTime() / 1000));
  const { data: jobs } = useJobs({
    limit: defaultLimit,
    offset: (page - 1) * defaultLimit,
    maxTimestamp: now,
  });
  const { data: newJobs } = useJobs({
    limit: defaultLimit,
    offset: (page - 1) * defaultLimit,
    minTimestamp: now,
  });

  const { data: users } = useUsersByAddresses(
    jobs?.map((job) => job.roles.creator) ?? []
  );
  console.log(users, 'ALL USERS');
  const { data: userJobNotifications } = useUserJobNotifications(
    account?.address!,
    jobs?.map((job) => job.id!) ?? []
  );

  return (
    <Layout>
      <h1 className='mb-8 ml-2 text-xl font-medium'>Open Jobs</h1>
      {newJobs?.length ? <div className='flex justify-center'>
        <div onClick={() => setNow(Math.floor(new Date().getTime() / 1000))} className='bg-green-300 px-3 py-1 rounded-md border-2 border-green-500 border-solid'>Found {newJobs.length} new jobs, click to refresh</div>
      </div> : <></>}
      {jobs?.map((job, idx) => {
        const notificationsCount =
          userJobNotifications?.[job.id!]?.filter(
            (notification) => !notification.read
          ).length ?? 0;
        return (
          <li
            key={idx}
            className='relative flex items-center space-x-4 rounded-md px-2 py-4 transition ease-in-out hover:bg-zinc-50 dark:hover:bg-zinc-950'
          >
            <div className='min-w-0 flex-auto'>
              <div className='flex items-center gap-x-3'>
                <img
                  src={tokensMap[job.token]?.icon}
                  alt=''
                  className='h-6 w-6 flex-none rounded-full bg-gray-100 dark:bg-gray-800'
                />

                <h2 className='min-w-0 text-sm font-semibold leading-6 text-black dark:text-white'>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className='flex gap-x-2'
                  >
                    <span className='truncate'>{job.title}</span>
                    <span className='text-gray-600 dark:text-gray-400'>/</span>
                    <span className='whitespace-nowrap text-gray-500 dark:text-gray-500'>
                      {moment.duration(job.maxTime, 'seconds').humanize()}
                    </span>
                    <span className='absolute inset-0' />
                  </Link>
                </h2>
              </div>
              <div className='mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-600 dark:text-gray-400'>
                <p className='truncate'>{users?.[job.roles.creator]?.name}</p>
                <svg
                  viewBox='0 0 2 2'
                  className='h-0.5 w-0.5 flex-none fill-gray-300'
                >
                  <circle cx={1} cy={1} r={1} />
                </svg>
                <p className='whitespace-nowrap'>
                  {/* <span className="text-green-500 dark:text-green-400">+{job.reputationPositive}</span>
                <span className="text-red-500 dark:text-red-400">-{job.reputationNegative}</span> */}
                  {/* {' '} reputation */}
                </p>
              </div>
            </div>
            <div
              className={clsx(
                'flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset'
              )}
            >
              <div className='flex flex-row gap-2'>
                {formatTokenNameAndAmount(job.token, job.amount)}
                <img
                  src={tokenIcon(job.token)}
                  alt=''
                  className='mr-1 h-4 w-4 flex-none'
                />
              </div>
            </div>
            <div>
              {notificationsCount > 0 && (
                <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white'>
                  {notificationsCount.toString()}
                </span>
              )}
            </div>
            <ChevronRightIcon
              className='h-5 w-5 flex-none text-gray-400'
              aria-hidden='true'
            />
          </li>
        );
      })}

      <PaginationComponent page={page} pages={pages} />
    </Layout>
  );
}
