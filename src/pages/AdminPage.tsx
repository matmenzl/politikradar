import AdminSection from "@/components/admin/AdminSection";

const AdminPage = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-6 py-3 md:py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="font-serif text-lg font-semibold text-foreground">PolitikRadar Admin</span>
      </div>
    </header>
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <AdminSection />
    </main>
  </div>
);

export default AdminPage;
