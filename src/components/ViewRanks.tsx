import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

interface RankData {
    _id: string;
    rankName: string;
    minSpending: number;
    benefits?: string;
}

interface VoucherData {
    _id: string;
    code: string;
    discount: number;
    isUsed: boolean;
}

interface UserRankResponse {
    success: boolean;
    message: string;
    totalSpending: number;
    rank: RankData | null;
    voucher: VoucherData | string;
}

const ViewRanks: React.FC = () => {
    const [rank, setRank] = useState<RankData | null>(null);
    const [totalSpending, setTotalSpending] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showBanner, setShowBanner] = useState<boolean>(false);
    const [voucher, setVoucher] = useState<VoucherData | string>("No available voucher");

    const fetchUserRank = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("token");
            const response = await fetch(`${backendApiUrl}/rank`, {

                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Error fetching rank: ${response.statusText}`);

            const data: UserRankResponse = await response.json();
            if (data.success) {
                const previousRank = Cookies.get("previousRank");
                setRank(data.rank);
                setTotalSpending(data.totalSpending);
                setVoucher(data.voucher);

                if (data.rank && data.rank.rankName !== previousRank) {
                    setShowBanner(true);
                    Cookies.set("previousRank", data.rank.rankName);
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserRank();
    }, []);

    if (loading) return <div className="text-center">Loading rank...</div>;
    if (error) return <div className="text-center text-red-600">Error: {error}</div>;

    return (
        <div className="w-full bg-[#fff] rounded-lg p-2">
            {/* {showBanner && rank && (
                <div className="bg-yellow-300 text-[#333] p-3 text-center rounded-md mb-4 font-bold text-sm relative">
                    🎉 Congratulations! You have just reached the rank of <strong>{rank.rankName}</strong> 🎉
                    <button
                        onClick={() =>
                            alert(
                                typeof voucher === "string"
                                    ? voucher
                                    : `${voucher.code}: -${voucher.discount}%`
                            )
                        }
                        className="ml-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition"
                    >
                        View Voucher
                    </button>
                    <button

                        onClick={() => setShowBanner(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-base text-[#333] hover:text-black"
                    >
                        ×

                    </button>
                </div>
            )} */}

            {/* 
            <h2 className="text-center text-[#5a3e2b] text-xl font-bold mb-4">Your Rank</h2> */}

            {/* <div className="flex flex-col gap-3  rounded-lg border  shadow-sm"> */}
            <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold text-[#5a3e2b] text-sm">Rank Name:</span>
                <span className="text-right text-sm text-gray-800">{rank ? rank.rankName : "No Rank"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold text-[#5a3e2b] text-sm">Min Spending:</span>
                <span className="text-right text-sm text-gray-800">{rank ? rank.minSpending : "N/A"}</span>
            </div>
            {/* <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-semibold text-[#5a3e2b] text-sm">Benefits:</span>
                    <span className="text-right text-sm text-gray-800">{rank?.benefits || "None"}</span>
                </div> */}
            <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold text-[#5a3e2b] text-sm">Total Spending:</span>
                <span className="text-right text-sm text-gray-800">{totalSpending.toLocaleString()}</span>
            </div>
            <div className="flex-col">
                <div className="font-semibold text-[#5a3e2b] text-sm">Voucher:</div>
                <div className="text-[13px] text-gray-800">
                    {typeof voucher === "string"
                        ? voucher
                        : `${voucher.code}(-${voucher.discount}%)`}
                </div>
            </div>

        </div>
        // </div>
    );
};

export default ViewRanks;
