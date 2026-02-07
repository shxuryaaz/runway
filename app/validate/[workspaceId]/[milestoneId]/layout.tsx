/** Public validation link: unindexed, non-discoverable. Evidence collection only. */
export const metadata = {
  robots: "noindex, nofollow",
};

export default function ValidateLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
