type FooterProps = {
  nameEn: string;
  nameAm: string;
  phone: string;
};

export function Footer({ nameEn, nameAm, phone }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold">{nameEn}</p>
        <p className="mt-1 text-sm text-slate-300">{nameAm}</p>
        <p className="mt-3 text-sm">
          Phone:{" "}
          <a className="hover:underline" href={`tel:${phone}`}>
            {phone}
          </a>
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Copyright {year}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
