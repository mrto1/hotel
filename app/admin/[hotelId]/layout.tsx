import { requireHotel } from "@/src/auth/guard";

export default async function HotelAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const { hotel, user, role } = await requireHotel(hotelId);
  return (
    <>
      <header className="admin-head">
        <div className="wrap">
          <a href="/admin" className="brand" style={{ fontSize: "1.05rem" }}>{hotel.name}</a>
          <nav>
            <a href={`/admin/${hotel.id}/calendar`}>Kalender</a>
            <a href={`/admin/${hotel.id}/bookings`}>Buchungen</a>
            <a href={`/admin/${hotel.id}/settings`}>Einstellungen</a>
            <a href={hotel.primaryDomain ? `//${hotel.primaryDomain}` : `/h/${hotel.slug}/de`} target="_blank">Website ↗</a>
          </nav>
          <span className="muted small" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>{user.email} · {role}</span>
          <form action="/api/auth/logout" method="post"><button className="btn secondary small">Abmelden</button></form>
        </div>
      </header>
      <main className="wrap admin-main">{children}</main>
    </>
  );
}
