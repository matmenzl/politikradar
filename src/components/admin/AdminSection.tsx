import AdminGate from "@/components/admin/AdminGate";
import AiAnalysisSection from "@/components/admin/AiAnalysisSection";
import EditorialSection from "@/components/admin/EditorialSection";
import { getCurrentISOWeek } from "@/lib/api/openparldata";

/** Combined admin view used by the standalone /admin route. */
const AdminSection = () => {
  const { year, week } = getCurrentISOWeek();
  return (
    <AdminGate title="Admin-Bereich">
      <div className="space-y-8">
        <AiAnalysisSection />
        <EditorialSection year={year} week={week} />
      </div>
    </AdminGate>
  );
};

export default AdminSection;
