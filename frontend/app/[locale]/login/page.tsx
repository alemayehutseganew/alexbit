import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginBranding } from './LoginBranding';
import { LoginActions } from './LoginActions';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    callbackUrl?: string;
    realm?: string;
    role?: string;
  }>;
};

function isLocalPortalCallback(
  callbackUrl: string | undefined,
  locale: string,
  portal: 'admin' | 'client' | 'shareholder',
): callbackUrl is string {
  return (
    callbackUrl === `/${locale}/${portal}` ||
    callbackUrl?.startsWith(`/${locale}/${portal}/`) === true ||
    callbackUrl === `/${portal}` ||
    callbackUrl?.startsWith(`/${portal}/`) === true
  );
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const [{ locale }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{
      callbackUrl?: string;
      realm?: string;
      role?: string;
    }>({}),
  ]);
  setRequestLocale(locale);

  const [brand, t] = await Promise.all([
    getTranslations({ locale, namespace: 'Brand' }),
    getTranslations({ locale, namespace: 'Login' }),
  ]);

  const clientCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    'client',
  )
    ? query.callbackUrl
    : `/${locale}/client`;
  const shareholderCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    'shareholder',
  )
    ? query.callbackUrl
    : `/${locale}/shareholder`;
  const adminCallbackUrl = isLocalPortalCallback(
    query.callbackUrl,
    locale,
    'admin',
  )
    ? query.callbackUrl
    : `/${locale}/admin`;
  const requestedRealm = query.role ?? query.realm;
  const preferredRealm =
    requestedRealm === 'client' || requestedRealm === 'shareholder'
      ? requestedRealm
      : null;
  return (
    <div className='relative isolate min-h-[calc(100svh-5.5rem)] overflow-hidden bg-slate-50 pb-10 pt-6 transition-colors dark:bg-slate-950 sm:pt-8'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 overflow-hidden'
      >
        <div className='absolute -right-24 -top-36 size-[28rem] rounded-full bg-cyan-200/40 blur-[110px] dark:bg-cyan-500/10' />
        <div className='absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-blue-200/40 blur-[120px] dark:bg-blue-500/10' />
      </div>
      <div className='relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:px-10'>
        <section className='relative hidden min-h-[min(42rem,calc(100svh-10rem))] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-[#06223f] px-8 py-10 text-white shadow-[0_28px_90px_rgba(8,58,112,0.22)] lg:flex sm:px-12 lg:px-14 lg:py-12'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:32px_32px]'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -right-28 -top-32 size-[30rem] rounded-full border border-white/10'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -right-12 -top-12 size-[20rem] rounded-full border border-cyan-100/10'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-cyan-300/20 blur-[110px]'
          />
          <LoginBranding
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
            companyNameEn={brand('nameEn')}
            companyNameAm={brand('nameAm')}
            phone={brand('phone')}
          />
        </section>

        <section className='flex w-full items-center justify-center py-4 lg:py-10'>
          <div className='flex w-full max-w-md items-center justify-center'>
            <LoginActions
              clientCallbackUrl={clientCallbackUrl}
              shareholderCallbackUrl={shareholderCallbackUrl}
              adminCallbackUrl={adminCallbackUrl}
              preferredRealm={preferredRealm}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
