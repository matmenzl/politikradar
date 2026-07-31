import AccessCodesPanel from "@/components/admin/AccessCodesPanel";
import AiAnalysisSection from "@/components/admin/AiAnalysisSection";
import EditorialSection from "@/components/admin/EditorialSection";
import { getCurrentISOWeek } from "@/lib/api/openparldata";

/** Combined admin view used by the standalone /admin route. */
const AdminSection = () => {
  const { year, week } = getCurrentISOWeek();
  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Admin-Bereich</h2>
      <AiAnalysisSection />
      <EditorialSection year={year} week={week} />
      <AccessCodesPanel />
    </div>
  );
};

export default AdminSection;
