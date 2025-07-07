import BestSellers from "./BestSeller";
import RevenueContent from "./RevenueContent";
import StatisticUser from "./StatisticUserContent";

function DashboardContent() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <StatisticUser />

      <div className="w-full flex flex-col lg:flex-row justify-between gap-6 mt-6">
        <RevenueContent />
        <BestSellers />
      </div>
    </div>
  )
}

export default DashboardContent