import { redirect } from 'next/navigation'

/** @deprecated Prefer /community — kept so old links still work */
export default function DiscoverRedirectPage() {
  redirect('/community')
}
