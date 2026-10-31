export function generateStaticParams() {
  return [{ nif: "PLACEHOLDER" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}