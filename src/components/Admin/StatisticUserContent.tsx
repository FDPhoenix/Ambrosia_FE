import type React from "react"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import annotationPlugin from "chartjs-plugin-annotation"
import { FaUser, FaUserShield, FaUserTie, FaUserFriends, FaComments } from "react-icons/fa"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
)

interface UserCounts {
  totalUsers: number
  adminCount: number
  customerCount: number
  staffCount: number
  chefCount: number
}

interface LineChartData {
  months: number[]
  subscribers: number[]
  year: number
}

interface BarChartData {
  days: number[]
  subscribers: number[]
  year: number
  month: number
}

interface FeedbackCountData {
  totalFeedback: number;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number | null;
    day: number | null;
  };
}

interface PieChartData {
  _id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  averageRating?: number;
  imageUrl?: string; // Added for tooltip
  dishImage?: string; // Added for tooltip
}

const StatisticUser: React.FC = () => {
  const currentDate = new Date()
  const [userCounts, setUserCounts] = useState<UserCounts>({
    totalUsers: 0,
    adminCount: 0,
    customerCount: 0,
    staffCount: 0,
    chefCount: 0,
  })
  const [lineChartData, setLineChartData] = useState<LineChartData>({
    months: [],
    subscribers: [],
    year: currentDate.getFullYear(),
  })
  const [barChartData, setBarChartData] = useState<BarChartData>({
    days: [],
    subscribers: [],
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  })
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  
  // Feedback states
  const [feedbackCount, setFeedbackCount] = useState<FeedbackCountData | null>(null);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [showFeedbackPieChart, setShowFeedbackPieChart] = useState(false);
  const [selectedFeedbackMonth, setSelectedFeedbackMonth] = useState<number>(currentDate.getMonth() + 1);
  const [pieTooltip, setPieTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: PieChartData;
  }>({ visible: false, x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const response = await axios.get(`${backendApiUrl}/api/revenue/quantity`)
        setUserCounts(response.data)
      } catch (error) {
        console.error("Error fetching user counts:", error)
      }
    }
    fetchUserCounts()
  }, [])

  useEffect(() => {
    const fetchLineChartData = async () => {
      try {
        const response = await axios.get(`${backendApiUrl}/api/revenue/line-chart?year=${selectedYear}`)
        setLineChartData(response.data)
      } catch (error) {
        console.error("Error fetching line chart data:", error)
      }
    }
    fetchLineChartData()
  }, [selectedYear])

  useEffect(() => {
    const fetchBarChartData = async () => {
      try {
        const response = await axios.get(
          `${backendApiUrl}/api/revenue/bar-chart?year=${selectedYear}&month=${selectedMonth}`,
        )
        setBarChartData(response.data)
      } catch (error) {
        console.error("Error fetching bar chart data:", error)
      }
    }
    fetchBarChartData()
  }, [selectedYear, selectedMonth])

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const monthStr = String(selectedFeedbackMonth).padStart(2, '0');
        const response = await fetch(`${backendApiUrl}/api/revenue/feedback/count?year=${currentYear}&month=${monthStr}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFeedbackCount(data);
        }
      } catch (error) {
        console.error("Error fetching feedback count:", error);
      }
    };
    
    fetchFeedbackData();
  }, [selectedFeedbackMonth]);

  const handleFeedbackClick = async () => {
    if (!showFeedbackPieChart) {
      // Check if current month has feedback data
      if (feedbackCount && feedbackCount.totalFeedback > 0) {
        fetchPieChartData();
        setShowFeedbackPieChart(true);
      } else {
        // Show filter with no data message immediately
        setShowFeedbackPieChart(true);
        setPieChartData([]);
      }
    } else {
      setShowFeedbackPieChart(false);
    }
  };

  const handleFeedbackMonthChange = async (month: number) => {
    setSelectedFeedbackMonth(month);
    if (showFeedbackPieChart) {
      fetchPieChartData();
    }
  };

  const handleLineChartClick = (_event: any, elements: any) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index
      const clickedMonth = lineChartData.months[clickedIndex]
      setSelectedMonth(clickedMonth)
    }
  }

  const lineChartConfig = {
    labels: lineChartData.months.map((month) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return monthNames[month - 1]
    }),
    datasets: [
      {
        label: "Users",
        data: lineChartData.subscribers,
        borderColor: "#1E90FF",
        backgroundColor: "#1E90FF",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  }

  const lineChartOptions = {
    scales: {
      y: { beginAtZero: true },
    },
    onClick: handleLineChartClick,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: () => "Click to view daily data",
          label: (context: any) => `Subscribers: ${context.raw}`,
        },
      },
      annotation: {
        annotations: {
          verticalLine: {
            type: "line" as const,
            scaleID: "x",
            value: undefined,
            borderColor: "#1E90FF",
            borderWidth: 2,
            drawTime: "afterDatasetsDraw" as const,
          },
          intersectionPoint: {
            type: "point" as const,
            xValue: undefined,
            yValue: undefined,
            backgroundColor: "#1E90FF",
            radius: 5,
            borderColor: "#fff",
            borderWidth: 2,
          },
        },
      },
    },
    hover: {
      mode: "index" as const,
      intersect: false,
    },
    onHover: (event: any, _chartElements: any, chart: any) => {
      const chartArea = chart.chartArea
      const mouseX = event.x - chartArea.left
      const labelWidth = (chartArea.right - chartArea.left) / lineChartConfig.labels.length
      const index = Math.floor(mouseX / labelWidth)

      if (index >= 0 && index < lineChartConfig.labels.length) {
        const label = lineChartConfig.labels[index]
        const yValue = lineChartData.subscribers[index]

        chart.options.plugins.annotation.annotations.verticalLine.value = label
        chart.options.plugins.annotation.annotations.intersectionPoint.xValue = label
        chart.options.plugins.annotation.annotations.intersectionPoint.yValue = yValue

        chart.tooltip.setActiveElements([{ datasetIndex: 0, index }], { x: event.x, y: event.y })
      } else {
        chart.options.plugins.annotation.annotations.verticalLine.value = undefined
        chart.options.plugins.annotation.annotations.intersectionPoint.xValue = undefined
        chart.options.plugins.annotation.annotations.intersectionPoint.yValue = undefined
      }

      chart.update()
    },
  }

  const barChartConfig = {
    labels: barChartData.days.map((day) => `Day ${day}`),
    datasets: [
      {
        label: "Users",
        data: barChartData.subscribers,
        backgroundColor: "#1E90FF",
      },
    ],
  }

  const renderPieChart = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (pieChartData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800">Feedback Distribution by Dish</h4>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Month:</span>
              <select
                value={selectedFeedbackMonth}
                onChange={(e) => handleFeedbackMonthChange(Number(e.target.value))}
                className="py-1 px-3 rounded-md border border-gray-300 text-sm cursor-pointer"
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h5 className="text-xl font-semibold text-gray-600 mb-2">
              No Feedback Data Available
            </h5>
            <p className="text-gray-500 mb-6">
              There is no feedback data for {monthNames[selectedFeedbackMonth - 1]} {new Date().getFullYear()}.
            </p>
            <p className="text-sm text-gray-400">
              Please select a different month to view feedback statistics.
            </p>
          </div>
        </div>
      );
    }

    const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="bg-white p-6 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-full">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-gray-800">Feedback Statistics</h4>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Month:</span>
            <select
              value={selectedFeedbackMonth}
              onChange={(e) => handleFeedbackMonthChange(Number(e.target.value))}
              className="py-1 px-3 rounded-md border border-gray-300 text-sm cursor-pointer"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-center mb-6 relative">
          <svg
            ref={svgRef}
            width="400"
            height="400"
            viewBox="0 0 400 400"
            style={{ cursor: pieChartData.length > 0 ? 'pointer' : 'default' }}
            onMouseLeave={() => { setPieTooltip({ ...pieTooltip, visible: false }); setHoveredPieIndex(null); }}
          >
            <circle cx="200" cy="200" r="160" fill="none" stroke="#e0e0e0" strokeWidth="2" />
            {pieChartData.length === 1 ? (
              <circle
                cx="200"
                cy="200"
                r={hoveredPieIndex === 0 ? 170 : 160}
                fill={pieChartData[0].color}
                style={{ transition: 'r 0.2s' }}
                onMouseMove={e => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  setPieTooltip({
                    visible: true,
                    x: e.clientX - (rect?.left || 0),
                    y: e.clientY - (rect?.top || 0),
                    data: pieChartData[0],
                  });
                  setHoveredPieIndex(0);
                }}
                onMouseLeave={() => { setPieTooltip({ ...pieTooltip, visible: false }); setHoveredPieIndex(null); }}
              />
            ) : (
              pieChartData.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const midAngle = startAngle + angle / 2;
                currentAngle += angle;

                const x1 = 200 + 160 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 200 + 160 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 200 + 160 * Math.cos((currentAngle - 90) * Math.PI / 180);
                const y2 = 200 + 160 * Math.sin((currentAngle - 90) * Math.PI / 180);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const pathData = [
                  `M 200 200`,
                  `L ${x1} ${y1}`,
                  `A 160 160 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');

                // Calculate text position for percentage
                const textRadius = 120;
                const textX = 200 + textRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                const textY = 200 + textRadius * Math.sin((midAngle - 90) * Math.PI / 180);

                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="3"
                      style={{
                        cursor: 'pointer',
                        transform: hoveredPieIndex === index ? 'scale(1.06)' : 'scale(1)',
                        transformOrigin: '200px 200px',
                        transition: 'transform 0.18s',
                      }}
                      onMouseMove={e => {
                        const rect = svgRef.current?.getBoundingClientRect();
                        setPieTooltip({
                          visible: true,
                          x: e.clientX - (rect?.left || 0),
                          y: e.clientY - (rect?.top || 0),
                          data: item,
                        });
                        setHoveredPieIndex(index);
                      }}
                      onMouseLeave={() => { setPieTooltip({ ...pieTooltip, visible: false }); setHoveredPieIndex(null); }}
                    />
                    {percentage > 5 && (
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-white"
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {percentage.toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
          {pieTooltip.visible && pieTooltip.data && (
            <div
              style={{
                position: 'absolute',
                left: pieTooltip.x + 10,
                top: pieTooltip.y + 10,
                zIndex: 10,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: 12,
                minWidth: 180,
                pointerEvents: 'none',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {(() => { console.log('Tooltip data:', pieTooltip.data); return null })()}
              {pieTooltip.data.dishImage && (
                <img src={pieTooltip.data.dishImage} alt={pieTooltip.data.name} style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 6, marginRight: 8 }} />
              )}
              <div>
                <div><b>{pieTooltip.data.name}</b></div>
                <div>Reviews: <b>{pieTooltip.data.value}</b></div>
                <div>Percentage: <b>{pieTooltip.data.percentage}%</b></div>
                {pieTooltip.data.averageRating !== undefined && (
                  <div>Avg. Rating: <b>{pieTooltip.data.averageRating} ⭐</b></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[180px] overflow-y-auto pr-2">
          {pieChartData.map((item, index) => (
            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div 
                className="w-4 h-4 rounded mr-3 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm mb-2 truncate">{item.name}</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Feedback:</span>
                    <span className="font-semibold text-gray-800">{item.value} reviews</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Percentage:</span>
                    <span className="font-semibold text-gray-800">{item.percentage}%</span>
                  </div>
                  {item.averageRating && (
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Average Rating:</span>
                      <span className="font-semibold text-gray-800 flex items-center">
                        {item.averageRating.toFixed(1)} ⭐
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const fetchPieChartData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const monthStr = String(selectedFeedbackMonth).padStart(2, '0');
      const response = await fetch(`${backendApiUrl}/api/revenue/feedback/pie-chart?year=${currentYear}&month=${monthStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pie chart data');
      }

      const data = await response.json();
      setPieChartData(data.pieChartData || []);
    } catch (error) {
      console.error('Error fetching pie chart data:', error);
      setPieChartData([]);
    }
  };

  useEffect(() => {
    if (showFeedbackPieChart) {
      fetchPieChartData();
    }
  }, [showFeedbackPieChart, selectedFeedbackMonth]);

  useEffect(() => {
    if (pieChartData.length > 0) {
      console.log('Pie chart data:', pieChartData);
    }
  }, [pieChartData]);

  return (
    <div className="w-[1200px] mb-5">
      <div className="flex justify-between mb-5">
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[18%] text-center transition-transform duration-200 hover:-translate-y-[5px]">
          <FaUser className="text-2xl text-[#1E90FF] mb-2.5" />
          <h3 className="text-2xl my-[10px_0_5px] text-gray-800">{userCounts.totalUsers}</h3>
          <p className="text-sm text-gray-500 my-[5px_0]">Total Users</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[18%] text-center transition-transform duration-200 hover:-translate-y-[5px]">
          <FaUserShield className="text-2xl text-[#1E90FF] mb-2.5" />
          <h3 className="text-2xl my-[10px_0_5px] text-gray-800">{userCounts.adminCount}</h3>
          <p className="text-sm text-gray-500 my-[5px_0]">Admins</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[18%] text-center transition-transform duration-200 hover:-translate-y-[5px]">
          <FaUserFriends className="text-2xl text-[#1E90FF] mb-2.5" />
          <h3 className="text-2xl my-[10px_0_5px] text-gray-800">{userCounts.customerCount}</h3>
          <p className="text-sm text-gray-500 my-[5px_0]">Customers</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[18%] text-center transition-transform duration-200 hover:-translate-y-[5px]">
          <FaUserTie className="text-2xl text-[#1E90FF] mb-2.5" />
          <h3 className="text-2xl my-[10px_0_5px] text-gray-800">{userCounts.staffCount}</h3>
          <p className="text-sm text-gray-500 my-[5px_0]">Staff</p>
        </div>
        <div 
          className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[18%] text-center transition-transform duration-200 hover:-translate-y-[5px] cursor-pointer"
          onClick={handleFeedbackClick}
        >
          <FaComments className="text-2xl text-[#1E90FF] mb-2.5" />
          <h3 className="text-2xl my-[10px_0_5px] text-gray-800">{feedbackCount?.totalFeedback || 0}</h3>
          <p className="text-sm text-gray-500 my-[5px_0]">Total Feedback</p>
          <p className="text-xs text-gray-400 mt-1">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][selectedFeedbackMonth - 1]} {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {showFeedbackPieChart && (
        <div className="mb-5">
          {renderPieChart()}
        </div>
      )}

      <div className="flex justify-between">
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[49%]">
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="text-lg m-0">Monthly Customers</h4>
            <div className="inline-block">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                className="py-[5px] px-[10px] rounded-md border border-gray-300 text-sm cursor-pointer"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Line data={lineChartConfig} options={lineChartOptions} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] w-[49%]">
          <h4 className="text-lg m-0">
            Daily Visitors ({selectedMonth}/{selectedYear})
          </h4>
          <p className="text-xs text-gray-500 m-0 mb-2.5">Click on a month in the line chart to view daily data.</p>
          <Bar
            data={barChartConfig}
            options={{
              scales: { y: { beginAtZero: true } },
              plugins: {
                legend: { position: "top" as const },
                title: { display: false },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default StatisticUser

